// apps/gateway/src/controllers/auth-gateway.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Delete,
  Patch,
  Inject,
  HttpStatus,
  HttpException,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { CreateUserDto } from '../../../auth-service/src/dto/create-user.dto';
import { LoginUserDto } from '../../../auth-service/src/dto/login-user.dto';
import { UpdateUserDto } from '../../../auth-service/src/dto/update-user.dto';
import { RolesGuard, UserRole } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import {
  AUTH_SERVICE_RABITTMQ,
  COMPLAINT_SERVICE_RABITTMQ,
} from '../../../../common/contstants';
import { JwtAuthGuard } from '../../../auth-service/src/guards/jwt.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../decorators/current-user.decorator';
import {
  CreateComplaintDto,
  UpdateComplaintDto,
} from '../../../complaint-service/src/complaint.dto';

@Controller('api')
export class ApiGatewayController {
  constructor(
    @Inject(AUTH_SERVICE_RABITTMQ)
    private readonly authClient: ClientProxy,
    @Inject(COMPLAINT_SERVICE_RABITTMQ)
    private readonly complaintClient: ClientProxy,
  ) {}

  private handleError(error: unknown): never {
    if (error instanceof HttpException) {
      throw error;
    }

    if (this.isErrorResponse(error)) {
      const statusCode = error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.message || 'Internal server error';
      throw new HttpException(message, statusCode);
    }

    if (error instanceof Error) {
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    throw new HttpException(
      'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  private isErrorResponse(
    error: unknown,
  ): error is { statusCode: number; message: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      'message' in error
    );
  }

  // ============= AUTH ENDPOINTS =============
  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    try {
      const result = await firstValueFrom(
        this.authClient.send({ cmd: 'register_user' }, dto).pipe(timeout(5000)),
      );
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post('login')
  async login(@Body() dto: LoginUserDto) {
    try {
      const result = await firstValueFrom(
        this.authClient.send({ cmd: 'login_user' }, dto).pipe(timeout(5000)),
      );
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: CurrentUserData) {
    try {
      const result = await firstValueFrom(
        this.authClient
          .send({ cmd: 'get_user_by_id' }, user.id)
          .pipe(timeout(5000)),
      );
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAll() {
    try {
      const result = await firstValueFrom(
        this.authClient.send({ cmd: 'get_users' }, {}).pipe(timeout(5000)),
      );
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getOne(@Param('id') id: string) {
    try {
      const result = await firstValueFrom(
        this.authClient
          .send({ cmd: 'get_user_by_id' }, parseInt(id))
          .pipe(timeout(5000)),
      );
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Patch('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    try {
      const result = await firstValueFrom(
        this.authClient
          .send({ cmd: 'update_user' }, { id: parseInt(id), dto })
          .pipe(timeout(5000)),
      );
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    try {
      const result = await firstValueFrom(
        this.authClient
          .send({ cmd: 'delete_user' }, parseInt(id))
          .pipe(timeout(5000)),
      );
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ============= COMPLAINTS ENDPOINTS =============
  @Post('complaints')
  @UseGuards(JwtAuthGuard)
  async createComplaint(@Body() dto: CreateComplaintDto) {
    try {
      const result = await firstValueFrom(
        this.complaintClient
          .send({ cmd: 'create_complaint' }, dto)
          .pipe(timeout(5000)),
      );
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get('complaints')
  async getAllComplaints(@Query('status') status?: string) {
    try {
      const result = await firstValueFrom(
        this.complaintClient
          .send({ cmd: 'get_complaints' }, { status })
          .pipe(timeout(5000)),
      );
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get('complaints/:id')
  async getOneComplaint(@Param('id') id: string) {
    try {
      const result = await firstValueFrom(
        this.complaintClient
          .send({ cmd: 'get_complaint_by_id' }, parseInt(id))
          .pipe(timeout(5000)),
      );
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Patch('complaints/:id')
  @UseGuards(JwtAuthGuard)
  async updateComplaint(
    @Param('id') id: string,
    @Body() dto: UpdateComplaintDto,
  ) {
    try {
      const result = await firstValueFrom(
        this.complaintClient
          .send({ cmd: 'update_complaint' }, { id: parseInt(id), dto })
          .pipe(timeout(5000)),
      );
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Delete('complaints/:id')
  @UseGuards(JwtAuthGuard)
  async removeComplaint(@Param('id') id: string) {
    try {
      const result = await firstValueFrom(
        this.complaintClient
          .send({ cmd: 'delete_complaint' }, parseInt(id))
          .pipe(timeout(5000)),
      );
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post('complaints/:id/approve')
  @UseGuards(JwtAuthGuard)
  async approveComplaint(@Param('id') id: string) {
    try {
      const result = await firstValueFrom(
        this.complaintClient
          .send({ cmd: 'approve_complaint' }, parseInt(id))
          .pipe(timeout(5000)),
      );
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post('complaints/:id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelComplaint(@Param('id') id: string) {
    try {
      const result = await firstValueFrom(
        this.complaintClient
          .send({ cmd: 'cancel_complaint' }, parseInt(id))
          .pipe(timeout(5000)),
      );
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post('complaints/:id/vote')
  @UseGuards(JwtAuthGuard)
  async voteComplaint(
    @Param('id') id: string,
    @Body() body: { voteType: 'for' | 'against' },
  ) {
    try {
      const result = await firstValueFrom(
        this.complaintClient
          .send({ cmd: 'vote_complaint' }, { id: parseInt(id), ...body })
          .pipe(timeout(5000)),
      );
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }
}
