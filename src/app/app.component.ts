import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Plugins } from '@capacitor/core';
import { Platform } from '@ionic/angular';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { concatMap } from 'rxjs/operators';
import { CameraService } from './shared/services/camera/camera.service';
import { CaptureService } from './shared/services/capture/capture.service';
import { CollectorService } from './shared/services/collector/collector.service';
import { CapacitorFactsProvider } from './shared/services/collector/facts/capacitor-facts-provider/capacitor-facts-provider.service';
import { WebCryptoApiSignatureProvider } from './shared/services/collector/signature/web-crypto-api-signature-provider/web-crypto-api-signature-provider.service';
import { DiaBackendAuthService } from './shared/services/dia-backend/auth/dia-backend-auth.service';
import { DiaBackendNotificationService } from './shared/services/dia-backend/notification/dia-backend-notification.service';
import { LanguageService } from './shared/services/language/language.service';
import { NotificationService } from './shared/services/notification/notification.service';
import { PushNotificationService } from './shared/services/push-notification/push-notification.service';
import { getOldProof } from './shared/services/repositories/proof/old-proof-adapter';
import { ProofRepository } from './shared/services/repositories/proof/proof-repository.service';

const { SplashScreen } = Plugins;

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(
    private readonly platform: Platform,
    private readonly collectorService: CollectorService,
    private readonly iconRegistry: MatIconRegistry,
    private readonly sanitizer: DomSanitizer,
    private readonly capacitorFactsProvider: CapacitorFactsProvider,
    private readonly webCryptoApiSignatureProvider: WebCryptoApiSignatureProvider,
    private readonly captureService: CaptureService,
    private readonly cameraService: CameraService,
    private readonly proofRepository: ProofRepository,
    notificationService: NotificationService,
    pushNotificationService: PushNotificationService,
    langaugeService: LanguageService,
    diaBackendAuthService: DiaBackendAuthService,
    diaBackendNotificationService: DiaBackendNotificationService
  ) {
    notificationService.requestPermission();
    pushNotificationService.register();
    langaugeService.initialize();
    diaBackendAuthService.initialize$().pipe(untilDestroyed(this)).subscribe();
    diaBackendNotificationService
      .initialize$()
      .pipe(untilDestroyed(this))
      .subscribe();
    this.initializeApp();
    this.restoreAppState();
    this.initializeProofRepository();
    this.initializeCollector();
    this.registerIcon();
  }

  async initializeApp() {
    await this.platform.ready();
    await SplashScreen.hide();
  }

  private restoreAppState() {
    this.cameraService.restoreKilledCaptureEvent$
      .pipe(
        concatMap(photo => this.captureService.capture(photo)),
        untilDestroyed(this)
      )
      .subscribe();
  }

  async initializeProofRepository() {
    const all = await this.proofRepository.getAll();
    for (const proof of all) {
      proof.willCollectTruth = false;
      await this.proofRepository.update(
        proof,
        (x, y) => getOldProof(x).hash === getOldProof(y).hash
      );
    }
  }

  initializeCollector() {
    this.webCryptoApiSignatureProvider.initialize();
    this.collectorService.addFactsProvider(this.capacitorFactsProvider);
    this.collectorService.addSignatureProvider(
      this.webCryptoApiSignatureProvider
    );
  }

  registerIcon() {
    this.iconRegistry.addSvgIcon(
      'media-id',
      this.sanitizer.bypassSecurityTrustResourceUrl('/assets/icon/media-id.svg')
    );
  }
}
