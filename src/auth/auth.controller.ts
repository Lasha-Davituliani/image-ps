import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './DTO/sign-up.dto';
import { SignInDto } from './DTO/sign-in.dto';
import { AuthGuard } from './guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("sign-up")
  signUp(@Body() signUpDto:SignUpDto) {
    return this.authService.signUp(signUpDto);
  }
  
  @Post("sign-in")
  signIn(@Body() signInDto:SignInDto) {
    return this.authService.signIn(signInDto);
  }
@UseGuards(AuthGuard)
@Get("current-user")
getCurrentUser(@Req() req) {
  const userId = req.userId;
  return this.authService.getCurrentUser(userId);
}
}
