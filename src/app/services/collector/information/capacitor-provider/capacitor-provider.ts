import { Plugins } from '@capacitor/core';
import { TranslocoService } from '@ngneat/transloco';
import { defer, Observable, of, zip } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Information } from 'src/app/services/data/information/information';
import { InformationRepository } from 'src/app/services/data/information/information-repository.service';
import { Proof } from 'src/app/services/data/proof/proof';
import { PreferenceManager } from 'src/app/utils/preferences/preference-manager';
import { InformationProvider } from '../information-provider';

const { Device, Geolocation } = Plugins;

const preferences = PreferenceManager.DEFAULT_INFORMATION_PROVIDER_PREF;
const enum PrefKeys {
  CollectDeviceInfo = 'collectDeviceInfo',
  CollectLocationInfo = 'collectLocationInfo'
}

export class CapacitorProvider extends InformationProvider {

  readonly name = 'Capacitor';

  constructor(
    informationRepository: InformationRepository,
    private readonly translocoService: TranslocoService
  ) {
    super(informationRepository);
  }

  static isDeviceInfoCollectionEnabled$() {
    return preferences.getBoolean$(PrefKeys.CollectDeviceInfo, true);
  }

  static setDeviceInfoCollection$(enable: boolean) {
    return preferences.setBoolean$(PrefKeys.CollectDeviceInfo, enable);
  }

  static isLocationInfoCollectionEnabled$() {
    return preferences.getBoolean$(PrefKeys.CollectLocationInfo, true);
  }

  static setLocationInfoCollection$(enable: boolean) {
    return preferences.setBoolean$(PrefKeys.CollectLocationInfo, enable);
  }

  protected provide$(proof: Proof): Observable<Information[]> {
    return zip(
      CapacitorProvider.isDeviceInfoCollectionEnabled$(),
      CapacitorProvider.isLocationInfoCollectionEnabled$()
    ).pipe(
      switchMap(([isDeviceInfoCollectionEnabled, isLocationInfoCollectionEnabled]) => zip(
        isDeviceInfoCollectionEnabled ? defer(() => Device.getInfo()) : of(undefined),
        isDeviceInfoCollectionEnabled ? defer(() => Device.getBatteryInfo()) : of(undefined),
        isDeviceInfoCollectionEnabled ? defer(() => Device.getLanguageCode()) : of(undefined),
        isLocationInfoCollectionEnabled ? defer(() => Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          maximumAge: 10 * 60 * 1000,
          timeout: 10 * 1000
        })) : of(undefined))),
      map(([deviceInfo, batteryInfo, languageCode, geolocationPosition]) => {
        const informationList: Information[] = [];
        if (deviceInfo !== undefined) {
          informationList.push({
            proofHash: proof.hash,
            provider: this.name,
            name: this.translocoService.translate('deviceName'),
            value: String(deviceInfo.name)
          }, {
            proofHash: proof.hash,
            provider: this.name,
            name: this.translocoService.translate('deviceModel'),
            value: String(deviceInfo.model)
          }, {
            proofHash: proof.hash,
            provider: this.name,
            name: this.translocoService.translate('devicePlatform'),
            value: String(deviceInfo.platform)
          }, {
            proofHash: proof.hash,
            provider: this.name,
            name: this.translocoService.translate('uuid'),
            value: String(deviceInfo.uuid)
          }, {
            proofHash: proof.hash,
            provider: this.name,
            name: this.translocoService.translate('appVersion'),
            value: String(deviceInfo.appVersion)
          }, {
            proofHash: proof.hash,
            provider: this.name,
            name: this.translocoService.translate('appVersionCode'),
            value: String(deviceInfo.appBuild)
          }, {
            proofHash: proof.hash,
            provider: this.name,
            name: this.translocoService.translate('operatingSystem'),
            value: String(deviceInfo.operatingSystem)
          }, {
            proofHash: proof.hash,
            provider: this.name,
            name: this.translocoService.translate('osVersion'),
            value: String(deviceInfo.osVersion)
          }, {
            proofHash: proof.hash,
            provider: this.name,
            name: this.translocoService.translate('deviceManufacturer'),
            value: String(deviceInfo.manufacturer)
          }, {
            proofHash: proof.hash,
            provider: this.name,
            name: this.translocoService.translate('runningOnVm'),
            value: String(deviceInfo.isVirtual)
          }, {
            proofHash: proof.hash,
            provider: this.name,
            name: this.translocoService.translate('usedMemory'),
            value: String(deviceInfo.memUsed)
          }, {
            proofHash: proof.hash,
            provider: this.name,
            name: this.translocoService.translate('freeDiskSpace'),
            value: String(deviceInfo.diskFree)
          }, {
            proofHash: proof.hash,
            provider: this.name,
            name: this.translocoService.translate('totalDiskSpace'),
            value: String(deviceInfo.diskTotal)
          });
        }
        if (batteryInfo !== undefined) {
          informationList.push({
            proofHash: proof.hash,
            provider: this.name,
            name: this.translocoService.translate('batteryLevel'),
            value: String(batteryInfo.batteryLevel)
          }, {
            proofHash: proof.hash,
            provider: this.name,
            name: this.translocoService.translate('batteryCharging'),
            value: String(batteryInfo.isCharging)
          });
        }
        if (languageCode !== undefined) {
          informationList.push({
            proofHash: proof.hash,
            provider: this.name,
            name: this.translocoService.translate('deviceLanguageCode'),
            value: String(languageCode.value)
          });
        }
        if (geolocationPosition !== undefined) {
          informationList.push({
            proofHash: proof.hash,
            provider: this.name,
            name: this.translocoService.translate('location'),
            value: `(${geolocationPosition.coords.latitude}, ${geolocationPosition.coords.longitude})`
          });
        }
        return informationList;
      })
    );
  }
}
