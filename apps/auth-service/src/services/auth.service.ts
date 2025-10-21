import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto) {
    const exists = await this.usersRepo.findOne({
      where: { email: dto.email },
    });

    if (exists) {
      throw new RpcException({
        statusCode: HttpStatus.CONFLICT,
        message: 'User already exists',
      });
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      ...dto,
      password: hashed,
    });

    await this.usersRepo.save(user);

    return this.generateToken(user);
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersRepo.findOne({ where: { email } });

    if (!user) {
      return null;
    }

    if (!user.isActive) {
      throw new RpcException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'User account is disabled',
      });
    }

    const match = await bcrypt.compare(password, user.password);
    return match ? user : null;
  }

  async login(dto: LoginUserDto) {
    const user = await this.validateUser(dto.email, dto.password);

    if (!user) {
      throw new RpcException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid credentials',
      });
    }

    return this.generateToken(user);
  }

  async getAllUsers() {
    const users = await this.usersRepo.find();
    return users.map((user) => {
      const { password, ...result } = user;
      return result;
    });
  }

  async getUserById(id: number) {
    const user = await this.usersRepo.findOne({ where: { id } });

    if (!user) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User not found',
      });
    }

    const { password, ...result } = user;
    return result;
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    const user = await this.usersRepo.findOne({ where: { id } });

    if (!user) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User not found',
      });
    }

    if (dto.email && dto.email !== user.email) {
      const exists = await this.usersRepo.findOne({
        where: { email: dto.email },
      });

      if (exists) {
        throw new RpcException({
          statusCode: HttpStatus.CONFLICT,
          message: 'Email already in use',
        });
      }
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    Object.assign(user, dto);
    await this.usersRepo.save(user);

    const { password, ...result } = user;
    return result;
  }

  async deleteUser(id: number) {
    const user = await this.usersRepo.findOne({ where: { id } });

    if (!user) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'User not found',
      });
    }

    await this.usersRepo.remove(user);
    return { message: 'User deleted successfully' };
  }

  private generateToken(user: User) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
