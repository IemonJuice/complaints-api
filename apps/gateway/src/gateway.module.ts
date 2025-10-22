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
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { CreateUserDto } from '../../../auth-service/src/dto/create-user.dto';
import { LoginUserDto } from '../../../auth-service/src/dto/login-user.dto';
import { UpdateUserDto } from '../../../auth-service/src/dto/update-user.dto';
import { RolesGuard, UserRole } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth-service/src/guards/jwt.guard';
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator';
import { CreateComplaintDto, UpdateComplaintDto } from '../../../complaint-service/src/complaint.dto';
import { AUTH_SERVICE_RABITTMQ, COMPLAINT_SERVICE_RABITTMQ } from '../../../../common/contstants';

@Controller('api')
export class ApiGatewayController {
  private readonly logger = new Logger(ApiGatewayController.name);

  constructor(
    @Inject(AUTH_SERVICE_RABITTMQ) private readonly authClient: ClientProxy,
    @Inject(COMPLAINT_SERVICE_RABITTMQ) private readonly complaintClient: ClientProxy,
  ) {}

  private async sendWithLogging(client: ClientProxy, pattern: any, payload: any) {
    this.logger.log('📤 Sending RMQ request');
    this.logger.debug('Pattern: ' + JSON.stringify(pattern));
    this.logger.debug('Payload: ' + JSON.stringify(payload));

    try {
      const result = await firstValueFrom(client.send(pattern, payload).pipe(timeout(5000)));
      this.logger.log('✅ RMQ response received');
      this.logger.debug('Response: ' + JSON.stringify(result));
      return result;
    } catch (error) {
      this.logger.error('❌ RMQ request failed');
      this.logger.error('Pattern: ' + JSON.stringify(pattern));
      this.logger.error('Payload: ' + JSON.stringify(payload));
      this.logger.error('Error object: ' + JSON.stringify(error, Object.getOwnPropertyNames(error)));
      throw new HttpException(
        error instanceof Error ? error.message : 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============= AUTH ENDPOINTS =============
  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return this.sendWithLogging(this.authClient, { cmd: 'register_user' }, dto);
  }

  @Post('login')
  async login(@Body() dto: LoginUserDto) {
    return this.sendWithLogging(this.authClient, { cmd: 'login_user' }, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: CurrentUserData) {
    return this.sendWithLogging(this.authClient, { cmd: 'get_user_by_id' }, user.id);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAll() {
    return this.sendWithLogging(this.authClient, { cmd: 'get_users' }, {});
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getOne(@Param('id') id: string) {
    return this.sendWithLogging(this.authClient, { cmd: 'get_user_by_id' }, parseInt(id));
  }

  @Patch('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.sendWithLogging(this.authClient, { cmd: 'update_user' }, { id: parseInt(id), dto });
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.sendWithLogging(this.authClient, { cmd: 'delete_user' }, parseInt(id));
  }

  // ============= COMPLAINTS ENDPOINTS =============
  @Post('complaints')
  @UseGuards(JwtAuthGuard)
  async createComplaint(@Body() dto: CreateComplaintDto) {
    return this.sendWithLogging(this.complaintClient, { cmd: 'create_complaint' }, dto);
  }

  @Get('complaints')
  async getAllComplaints(@Query('status') status?: string) {
    return this.sendWithLogging(this.complaintClient, { cmd: 'get_complaints' }, { status });
  }

  @Get('complaints/:id')
  async getOneComplaint(@Param('id') id: string) {
    return this.sendWithLogging(this.complaintClient, { cmd: 'get_complaint_by_id' }, parseInt(id));
  }

  @Patch('complaints/:id')
  @UseGuards(JwtAuthGuard)
  async updateComplaint(@Param('id') id: string, @Body() dto: UpdateComplaintDto) {
    return this.sendWithLogging(this.complaintClient, { cmd: 'update_complaint' }, { id: parseInt(id), dto });
  }

  @Delete('complaints/:id')
  @UseGuards(JwtAuthGuard)
  async removeComplaint(@Param('id') id: string) {
    return this.sendWithLogging(this.complaintClient, { cmd: 'delete_complaint' }, parseInt(id));
  }

  @Post('complaints/:id/approve')
  @UseGuards(JwtAuthGuard)
  async approveComplaint(@Param('id') id: string) {
    return this.sendWithLogging(this.complaintClient, { cmd: 'approve_complaint' }, parseInt(id));
  }

  @Post('complaints/:id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelComplaint(@Param('id') id: string) {
    return this.sendWithLogging(this.complaintClient, { cmd: 'cancel_complaint' }, parseInt(id));
  }

  @Post('complaints/:id/vote')
  @UseGuards(JwtAuthGuard)
  async voteComplaint(@Param('id') id: string, @Body() body: { voteType: 'for' | 'against' }) {
    return this.sendWithLogging(this.complaintClient, { cmd: 'vote_complaint' }, { id: parseInt(id), ...body });
  }
}
