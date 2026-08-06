import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {  FormBuilder,  FormGroup,  Validators} from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [  ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  loginForm!: FormGroup;
 hidePassword = true;

togglePassword() {
  this.hidePassword = !this.hidePassword;
}

  constructor( private fb: FormBuilder){}

  
  ngOnInit(): void {this.loginForm = this.fb.group({
        email: ['',[Validators.required,Validators.email]],

        password:['',[Validators.required,Validators.minLength(6)]]

    });

}


onSubmit(): void{

    if(this.loginForm.invalid){

        this.loginForm.markAllAsTouched();

        return;

    }

    console.log(this.loginForm.value);

}


}


