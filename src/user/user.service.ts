import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async createUser(name: string, email: string): Promise<UserDocument> {
    const user = new User();
    user.name = name;
    user.email = email;
    return await this.userModel.create(user);
  }

  async getUserById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(
    id: string,
    updates: Partial<Pick<User, 'name' | 'credits'>>,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updates, { new: true })
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
