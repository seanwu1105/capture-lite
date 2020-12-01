import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Plugins } from '@capacitor/core';
import { ToastController } from '@ionic/angular';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { defer } from 'rxjs';
import { catchError, concatMapTo } from 'rxjs/operators';
import { BlockingActionService } from '../../services/blocking-action/blocking-action.service';
import { WebCryptoApiSignatureProvider } from '../../services/collector/signature/web-crypto-api-provider/web-crypto-api-signature-provider.service';
import { NumbersStorageApi } from '../../services/publisher/numbers-storage/numbers-storage-api.service';
import { AssetRepository } from '../../services/publisher/numbers-storage/repositories/asset/asset-repository.service';
import { IgnoredTransactionRepository } from '../../services/publisher/numbers-storage/repositories/ignored-transaction/ignored-transaction-repository.service';

const { Clipboard } = Plugins;

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage {
  readonly username$ = this.numbersStorageApi.getUsername$();
  readonly email$ = this.numbersStorageApi.getEmail$();
  readonly publicKey$ = this.webCryptoApiSignatureProvider.getPublicKey$();
  readonly privateKey$ = this.webCryptoApiSignatureProvider.getPrivateKey$();

  constructor(
    private readonly router: Router,
    private readonly blockingActionService: BlockingActionService,
    private readonly toastController: ToastController,
    private readonly translocoService: TranslocoService,
    private readonly snackBar: MatSnackBar,
    private readonly numbersStorageApi: NumbersStorageApi,
    private readonly assetRepository: AssetRepository,
    private readonly ignoredTransactionRepository: IgnoredTransactionRepository,
    private readonly webCryptoApiSignatureProvider: WebCryptoApiSignatureProvider
  ) {}

  async copyToClipboard(value: string) {
    await Clipboard.write({ string: value });
    this.snackBar.open(
      this.translocoService.translate('message.copiedToClipboard')
    );
  }

  logout() {
    const action$ = this.assetRepository.removeAll$().pipe(
      concatMapTo(this.ignoredTransactionRepository.removeAll$()),
      concatMapTo(this.numbersStorageApi.logout$()),
      concatMapTo(defer(() => this.router.navigate(['/login']))),
      catchError(err =>
        this.toastController
          .create({ message: JSON.stringify(err.error), duration: 4000 })
          .then(toast => toast.present())
      )
    );
    this.blockingActionService
      .run$(action$, {
        message: this.translocoService.translate('talkingToTheServer'),
      })
      .pipe(untilDestroyed(this))
      .subscribe();
  }
}
