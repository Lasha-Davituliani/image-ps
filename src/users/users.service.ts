import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schema/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel("user") private userModel:Model<User>){}
 async create(createUserDto: CreateUserDto) {
    const createUser = await this.userModel.create(createUserDto)
    return createUser;
  }

  findAll() {
    return this.userModel.find();
  }

 


  async findByEmail(email:string){
    const findUserByEmail = await this.userModel.findOne({email:email}).select("+password");
    return findUserByEmail;
  }

  // async findOne(id: string) {
  //   const findUserById = await this.userModel.findById(id).populate('images');
  //   return findUserById;
  // }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).populate('images');
    
    if (!user) {
        return null;
    }
    
    const userObject = user.toObject();
    
    const storageInMB = (userObject.totalStorageUsed / (1024 * 1024)).toFixed(2);

    return {
        ...userObject,
        totalStorageUsedMB: `${storageInMB} MB`,
        imageCount: userObject.images?.length || 0
    };
}

  async update(id:  string, updateUserDto: UpdateUserDto) {
    const updatedUser = await this.userModel.findByIdAndUpdate(id, updateUserDto,{new:true})
    return updatedUser;
  }

  async remove(id: string) {
    const deletedUser = await this.userModel.findByIdAndDelete(id);
    return deletedUser;
  }
}
