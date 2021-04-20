import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslocoModule } from '@ngneat/transloco';
import { AvatarComponent } from './components/avatar/avatar.component';
import { MediaComponent } from './components/media/media.component';
import { MigratingDialogComponent } from './components/migrating-dialog/migrating-dialog.component';
import { CapacitorPluginsModule } from './core/capacitor-plugins/capacitor-plugins.module';
import { MaterialModule } from './core/material/material.module';
import { StartsWithPipe } from './pipes/starts-with/starts-with.pipe';

const declarations = [
  MigratingDialogComponent,
  AvatarComponent,
  MediaComponent,
  StartsWithPipe,
];

const imports = [
  CommonModule,
  IonicModule,
  FormsModule,
  ReactiveFormsModule,
  HttpClientModule,
  TranslocoModule,
  MaterialModule,
  CapacitorPluginsModule,
];

@NgModule({
  declarations,
  imports,
  exports: [...declarations, ...imports],
})
export class SharedModule {}
