import { BadRequestException, CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private  jwtService: JwtService) {}
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        console.log(request.headers);
        const token = this.getToken(request.headers);
        if(!token) throw new BadRequestException('Token not found');
        try{
            const payload = this.jwtService.verify(token);
            request.userId = payload.userId;

        }catch(error){
            throw new BadRequestException('Invalid token');
        }
        return true;
    }

    getToken(headers){
        if(!headers['authorization']) return null;
        const [type, token] = headers['authorization'].split(' ');
        return type === 'Bearer' ? token : null;
    }
}