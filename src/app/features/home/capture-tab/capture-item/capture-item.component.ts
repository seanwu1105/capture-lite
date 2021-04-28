import { Component, HostListener, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { combineLatest, iif, of, ReplaySubject } from 'rxjs';
import {
  catchError,
  concatMap,
  distinctUntilChanged,
  first,
  map,
  shareReplay,
  switchMap,
} from 'rxjs/operators';
import { CaptureService } from '../../../../shared/services/capture/capture.service';
import { getOldProof } from '../../../../shared/services/repositories/proof/old-proof-adapter';
import { Proof } from '../../../../shared/services/repositories/proof/proof';
import { isValidGeolocation } from '../capture-details/capture-details.page';

@UntilDestroy()
@Component({
  selector: 'app-capture-item',
  templateUrl: './capture-item.component.html',
  styleUrls: ['./capture-item.component.scss'],
})
export class CaptureItemComponent {
  private readonly proof$ = new ReplaySubject<Proof>(1);

  @Input()
  set proof(value: Proof | undefined) {
    if (value) this.proof$.next(value);
  }

  private readonly oldProofHash$ = this.proof$.pipe(
    map(proof => getOldProof(proof).hash)
  );

  readonly thumbnailUrl$ = this.proof$.pipe(
    distinctUntilChanged((x, y) => getOldProof(x).hash === getOldProof(y).hash),
    switchMap(proof => proof.thumbnailUrl$),
    catchError(() => of(undefined)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly hasUploaded$ = this.proof$.pipe(
    map(proof => !!proof.diaBackendAssetId)
  );

  readonly isCollecting$ = combineLatest([
    this.oldProofHash$,
    this.captureService.collectingOldProofHashes$,
  ]).pipe(
    map(([oldProofHash, collectingOldProofHashes]) =>
      collectingOldProofHashes.has(oldProofHash)
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly hasGeolocation$ = this.proof$.pipe(
    map(proof => isValidGeolocation(proof))
  );

  readonly isVideo$ = this.proof$.pipe(
    concatMap(proof => proof.getFirstAssetMeta()),
    map(meta => meta.mimeType.startsWith('video'))
  );

  constructor(
    private readonly captureService: CaptureService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  @HostListener('click')
  onClick() {
    return this.isCollecting$
      .pipe(
        first(),
        switchMap(isCollecting =>
          iif(
            () => !isCollecting,
            this.oldProofHash$.pipe(
              first(),
              concatMap(oldProofHash =>
                this.router.navigate(['capture-details', { oldProofHash }], {
                  relativeTo: this.route,
                })
              )
            )
          )
        ),
        untilDestroyed(this)
      )
      .subscribe();
  }
}
