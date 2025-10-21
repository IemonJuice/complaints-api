import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from '../services/auth.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'register_user' })
  async register(@Payload() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  @MessagePattern({ cmd: 'login_user' })
  async login(@Payload() dto: LoginUserDto) {
    return this.authService.login(dto);
  }

  @MessagePattern({ cmd: 'get_users' })
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  @MessagePattern({ cmd: 'get_user_by_id' })
  async getUserById(@Payload() id: number) {
    return this.authService.getUserById(id);
  }

  @MessagePattern({ cmd: 'update_user' })
  async updateUser(@Payload() payload: { id: number; dto: UpdateUserDto }) {
    return this.authService.updateUser(payload.id, payload.dto);
  }

  @MessagePattern({ cmd: 'delete_user' })
  async deleteUser(@Payload() id: number) {
    return this.authService.deleteUser(id);
  }
}