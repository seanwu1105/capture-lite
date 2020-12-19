import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Plugins } from '@capacitor/core';
import { TranslocoService } from '@ngneat/transloco';
import { isEqual, reject } from 'lodash';
import { combineLatest, defer, forkJoin, Observable, TimeoutError } from 'rxjs';
import {
  catchError,
  concatMap,
  concatMapTo,
  distinctUntilChanged,
  filter,
  map,
  timeout,
} from 'rxjs/operators';
import { LanguageService } from '../../language/language.service';
import { PreferenceManager } from '../../preference-manager/preference-manager.service';
import { PushNotificationService } from '../../push-notification/push-notification.service';
import { BASE_URL } from '../secret';

const { Device, Storage } = Plugins;

@Injectable({
  providedIn: 'root',
})
export class DiaBackendAuthService {
  private readonly preferences = this.preferenceManager.getPreferences(
    DiaBackendAuthService.name
  );
  private readonly loginTimeout = 20000;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly languageService: LanguageService,
    private readonly preferenceManager: PreferenceManager,
    private readonly pushNotificationService: PushNotificationService,
    private readonly snackbar: MatSnackBar,
    private readonly translocoService: TranslocoService
  ) {}

  // TODO: remove this method
  private async migrate() {
    const oldToken = await Storage.get({
      key: 'numbersStoragePublisher_authToken',
    });
    if (oldToken.value) {
      const splitted = oldToken.value.split(' ');
      if (splitted[0] === 'token' && splitted[1]) {
        this.setToken(splitted[1]);
      }
    }

    const oldUsername = await Storage.get({
      key: 'numbersStoragePublisher_userName',
    });
    if (oldUsername.value) {
      this.setUsername(oldUsername.value);
    }

    const oldEmail = await Storage.get({
      key: 'numbersStoragePublisher_email',
    });
    if (oldEmail.value) {
      this.setEmail(oldEmail.value);
    }
  }

  initialize$() {
    return this.getAuthHeaders$().pipe(
      concatMap(headers =>
        combineLatest([
          this.updateDevice$(headers),
          this.updateLanguage$(headers),
        ])
      )
    );
  }

  login$(email: string, password: string): Observable<LoginResult> {
    return this.httpClient
      .post<LoginResponse>(`${BASE_URL}/auth/token/login/`, {
        email,
        password,
      })
      .pipe(
        timeout(this.loginTimeout),
        catchError((error: TimeoutError | HttpErrorResponse) => {
          this.showLoginErrorMessage(error);
          throw new Error('Login failed');
        }),
        concatMap(response => this.setToken(response.auth_token)),
        concatMapTo(this.readUser$()),
        concatMap(response =>
          forkJoin([
            this.setUsername(response.username),
            this.setEmail(response.email),
          ])
        ),
        map(([username, _email]) => ({ username, email: _email }))
      );
  }

  private showLoginErrorMessage(error: TimeoutError | HttpErrorResponse) {
    let message;
    switch (error?.name) {
      case 'TimeoutError': {
        message = this.translocoService.translate('error.loginTimeoutError');
        break;
      }
      case 'HttpErrorResponse': {
        message = this.translocoService.translate(
          'error.loginHttpResponseError'
        );
        break;
      }
      default: {
        message = this.translocoService.translate('error.loginUnkownError');
        break;
      }
    }
    this.snackbar.open(message, this.translocoService.translate('dismiss'), {
      duration: 4000,
      panelClass: ['snackbar-error'],
    });
  }

  private readUser$() {
    return defer(() => this.getAuthHeaders()).pipe(
      concatMap(headers =>
        this.httpClient.get<ReadUserResponse>(`${BASE_URL}/auth/users/me/`, {
          headers,
        })
      )
    );
  }

  logout$() {
    return defer(() => this.getAuthHeaders()).pipe(
      concatMap(headers =>
        this.httpClient.post(`${BASE_URL}/auth/token/logout/`, {}, { headers })
      ),
      concatMapTo(
        defer(() =>
          Promise.all([
            this.setToken(''),
            this.setEmail(''),
            this.setUsername(''),
          ])
        )
      )
    );
  }

  createUser$(username: string, email: string, password: string) {
    return this.httpClient.post<CreateUserResponse>(`${BASE_URL}/auth/users/`, {
      username,
      email,
      password,
    });
  }

  updateLanguage$(headers: { [header: string]: string | string[] }) {
    return this.languageService.currentLanguageKey$.pipe(
      distinctUntilChanged(isEqual),
      concatMap(language =>
        this.httpClient.patch(
          `${BASE_URL}/auth/users/me/`,
          { language },
          { headers }
        )
      )
    );
  }

  private updateDevice$(headers: { [header: string]: string | string[] }) {
    return combineLatest([
      this.pushNotificationService.getToken$(),
      defer(() => Device.getInfo()),
    ]).pipe(
      concatMap(([fcmToken, deviceInfo]) =>
        this.httpClient.post(
          `${BASE_URL}/auth/devices/`,
          {
            fcm_token: fcmToken,
            platform: deviceInfo.platform,
            device_identifier: deviceInfo.uuid,
          },
          { headers }
        )
      )
    );
  }

  hasLoggedIn$() {
    return this.preferences
      .getString$(PrefKeys.TOKEN)
      .pipe(map(token => token !== ''));
  }

  async hasLoggedIn() {
    await this.migrate();
    const token = await this.preferences.getString(PrefKeys.TOKEN);
    return !!token;
  }

  getUsername$() {
    return this.preferences.getString$(PrefKeys.USERNAME);
  }

  async getUsername() {
    return this.preferences.getString(PrefKeys.USERNAME);
  }

  private async setUsername(value: string) {
    return this.preferences.setString(PrefKeys.USERNAME, value);
  }

  getEmail$() {
    return this.preferences.getString$(PrefKeys.EMAIL);
  }

  async getEmail() {
    return this.preferences.getString(PrefKeys.EMAIL);
  }

  private async setEmail(value: string) {
    return this.preferences.setString(PrefKeys.EMAIL, value);
  }

  async getAuthHeaders() {
    return { authorization: `token ${await this.getToken()}` };
  }

  getAuthHeaders$() {
    return this.getToken$().pipe(
      map(token => ({ authorization: `token ${token}` }))
    );
  }

  private async getToken() {
    return new Promise<string>(resolve => {
      this.preferences.getString(PrefKeys.TOKEN).then(token => {
        if (token.length !== 0) {
          resolve(token);
        } else {
          reject(new Error('Cannot get DIA backend token which is empty.'));
        }
      });
    });
  }

  private getToken$() {
    return this.preferences
      .getString$(PrefKeys.TOKEN)
      .pipe(filter(token => token.length !== 0));
  }

  private async setToken(value: string) {
    return this.preferences.setString(PrefKeys.TOKEN, value);
  }
}

const enum PrefKeys {
  TOKEN = 'TOKEN',
  USERNAME = 'USERNAME',
  EMAIL = 'EMAIL',
}

interface LoginResult {
  readonly username: string;
  readonly email: string;
}

export interface LoginResponse {
  readonly auth_token: string;
}

export interface ReadUserResponse {
  readonly username: string;
  readonly email: string;
}

// tslint:disable-next-line: no-empty-interface
interface CreateUserResponse {}
