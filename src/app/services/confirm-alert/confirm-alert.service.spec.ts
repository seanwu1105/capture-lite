import { TestBed } from '@angular/core/testing';
import { AlertController } from '@ionic/angular';
import { SharedTestingModule } from '../../shared/shared-testing.module';
import { ConfirmAlert } from './confirm-alert.service';

describe('ConfirmAlert', () => {
  let service: ConfirmAlert;
  let alertController: AlertController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedTestingModule],
    });
    service = TestBed.inject(ConfirmAlert);
    alertController = TestBed.inject(AlertController);
    const htmlIonAlertElementSpy = jasmine.createSpyObj('HTMLIonAlertElement', {
      present: new Promise(resolve => resolve()),
    });
    spyOn(alertController, 'create').and.returnValue(htmlIonAlertElementSpy);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should be able to present alert', () =>
    expect(service.present()).toBeTruthy());
});
