import { Injectable } from '@angular/core';

declare var google: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {

  initGoogle(clientId: string, callback: (token: string) => void) {
    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: any) => {
        callback(response.credential); // ID Token
      }
    });
  }

  renderButton(elementId: string) {
    google.accounts.id.renderButton(
      document.getElementById(elementId),
      {
        theme: 'outline',
        size: 'large',
        width: 300
      }
    );
  }
}
