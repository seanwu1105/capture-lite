import { Injectable } from '@angular/core';
import { FilesystemDirectory, FilesystemEncoding, Plugins } from '@capacitor/core';
import { BehaviorSubject, defer, forkJoin, from, of, zip } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { sha256$ } from 'src/app/utils/crypto/crypto';
import { MimeType } from 'src/app/utils/mime-type';
import { Proof } from './proof';

const { Filesystem } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class ProofRepository {

  private readonly proofDir = FilesystemDirectory.Data;
  private readonly proofFolderName = 'proof';
  private readonly rawFileDir = FilesystemDirectory.Data;
  private readonly rawFileFolderName = 'raw';
  private readonly proofList$ = new BehaviorSubject(new Set<Proof>());

  refresh$() {
    return defer(() => Filesystem.readdir({
      path: `${this.proofFolderName}`,
      directory: this.proofDir
    })).pipe(
      map(result => result.files),
      switchMap(fileNames => forkJoin(fileNames.map(fileName => this.readProof$(fileName)))),
      map(results => results.map(result => JSON.parse(result.data) as Proof)),
      tap(proofList => this.proofList$.next(new Set(proofList)))
    );
  }

  private readProof$(fileName: string) {
    return defer(() => Filesystem.readFile({
      path: `${this.proofFolderName}/${fileName}`,
      directory: this.proofDir,
      encoding: FilesystemEncoding.UTF8
    }));
  }

  getAll$() {
    return this.refresh$().pipe(
      switchMap(_ => this.proofList$.asObservable())
    );
  }

  getByHash$(hash: string) {
    return this.refresh$().pipe(
      switchMap(_ => this.proofList$),
      map(proofSet => [...proofSet].find(proof => proof.hash === hash))
    );
  }

  add$(...proofs: Proof[]) {
    return forkJoin(proofs.map(proof => this.saveProofFile$(proof))).pipe(
      map(results => results.map(result => result.uri)),
      switchMap(uris => zip(of(uris), this.refresh$())),
      map(([uris, _]) => uris)
    );
  }

  private saveProofFile$(proof: Proof) {
    return defer(() => Filesystem.writeFile({
      path: `${this.proofFolderName}/${proof.hash}.json`,
      data: JSON.stringify(proof),
      directory: this.proofDir,
      encoding: FilesystemEncoding.UTF8
    }));
  }

  remove$(...proofs: Proof[]) {
    return forkJoin(proofs.map(proof => this.deleteProofFile$(proof))).pipe(
      switchMap(_ => this.refresh$())
    );
  }

  private deleteProofFile$(proof: Proof) {
    return defer(() => Filesystem.deleteFile({
      path: `${this.proofFolderName}/${proof.hash}.json`,
      directory: this.proofDir
    }));
  }

  getRawFile$(proofOrHash: Proof | string) {
    return defer(() => {
      if (typeof proofOrHash === 'object') { return of(proofOrHash); }
      else { return this.getByHash$(proofOrHash); }
    }).pipe(
      switchMap(proof => from(Filesystem.readFile({
        path: `${this.rawFileFolderName}/${proof.hash}.${proof.mimeType.extension}`,
        directory: this.rawFileDir
      }))),
      map(result => result.data)
    );
  }

  /**
   * Copy [rawBase64] to add raw file to internal storage.
   * @param rawBase64 The original source of raw file which will be copied.
   * @param mimeType The file added in the internal storage. The name of the returned file will be its hash with original extension.
   */
  addRawFile$(rawBase64: string, mimeType: MimeType) {
    return sha256$(rawBase64).pipe(
      switchMap(hash => Filesystem.writeFile({
        path: `${this.rawFileFolderName}/${hash}.${mimeType.extension}`,
        data: rawBase64,
        directory: this.rawFileDir
      })),
      map(result => result.uri)
    );
  }

  removeRawFile$(proof: Proof) {
    return defer(() => Filesystem.deleteFile({
      path: `${this.rawFileFolderName}/${proof.hash}.${proof.mimeType.extension}`,
      directory: this.rawFileDir
    }));
  }
}
