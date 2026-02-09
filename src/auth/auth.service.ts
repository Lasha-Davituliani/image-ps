import { BadRequestException, Injectable } from '@nestjs/common';
import { SignUpDto } from './DTO/sign-up.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { SignInDto } from './DTO/sign-in.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private  usersService: UsersService, private jwtService: JwtService) {}
    async signUp(signUpDto:SignUpDto) {
        const userExists = await this.usersService.findByEmail(signUpDto.email);
        if(userExists) throw new BadRequestException("User with this email already exists");
        const hashedPassword = await bcrypt.hash(signUpDto.password, 10);
        console.log(hashedPassword);
        const user = await this.usersService.create({...signUpDto, password: hashedPassword});
        return "User registered successfully";
    }

    async signIn(signInDto:SignInDto) {
        const user = await this.usersService.findByEmail(signInDto.email);
        if(!user) throw new BadRequestException("Invalid email or password");
        const isPasswordValid = await bcrypt.compare(signInDto.password, user.password);
        if(!isPasswordValid) throw new BadRequestException("Invalid email or password");
        const payload={
            userId:user._id,
            email:user.email            
        }
        const accessToken = await this.jwtService.sign(payload,{expiresIn:'1h'});
        return {accessToken};
    }

    async getCurrentUser(userId:string) {
        const user = await this.usersService.findOne(userId);
        if(!user) throw new BadRequestException("User not found");
        return user;
    }
}
