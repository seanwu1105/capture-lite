import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { IonicModule } from '@ionic/angular';
import { TranslocoModule } from '@ngneat/transloco';
import { AssetPageRoutingModule } from './asset-routing.module';
import { AssetPage } from './asset.page';
import { ContactSelectionDialogComponent } from './contact-selection-dialog/contact-selection-dialog.component';
import { FriendInvitationDialogComponent } from './contact-selection-dialog/friend-invitation-dialog/friend-invitation-dialog.component';
import { OptionsMenuComponent } from './options-menu/options-menu.component';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    AssetPageRoutingModule,
    TranslocoModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSnackBarModule,
    MatInputModule,
    MatDialogModule,
    MatFormFieldModule,
    MatBottomSheetModule,
  ],
  declarations: [
    AssetPage,
    ContactSelectionDialogComponent,
    FriendInvitationDialogComponent,
    OptionsMenuComponent,
  ],
})
export class AssetPageModule {}
