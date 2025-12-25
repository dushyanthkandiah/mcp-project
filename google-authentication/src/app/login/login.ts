import { AfterViewInit, Component } from '@angular/core';
import { GoogleAuthService } from '../auth/google-auth';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements AfterViewInit {
  private clientId = '802575371260-3qu296dv115pd7ga32ke5ed9vkvs07u8.apps.googleusercontent.com';

  constructor(private googleAuth: GoogleAuthService) { }

  ngAfterViewInit(): void {
    this.googleAuth.initGoogle(this.clientId, (token) => {
      console.log('Google ID Token:', token);
      localStorage.setItem('google-token', token);
    });

    this.googleAuth.renderButton('google-btn');
  }




}
