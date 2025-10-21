// apps/complaint-service/src/complaint-service.controller.ts
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ComplaintServiceService } from './complaint-service.service';
import { CreateComplaintDto, UpdateComplaintDto } from './complaint.dto';

@Controller()
export class ComplaintServiceController {
  constructor(private readonly complaintService: ComplaintServiceService) {}

  @MessagePattern({ cmd: 'create_complaint' })
  async create(@Payload() dto: CreateComplaintDto) {
    return await this.complaintService.create(dto);
  }

  @MessagePattern({ cmd: 'get_complaints' })
  async findAll() {
    return await this.complaintService.findAll();
  }

  @MessagePattern({ cmd: 'get_complaint_by_id' })
  async findOne(@Payload() id: number) {
    return await this.complaintService.findOne(id);
  }

  @MessagePattern({ cmd: 'update_complaint' })
  async update(@Payload() data: { id: number; dto: UpdateComplaintDto }) {
    return await this.complaintService.update(data.id, data.dto);
  }

  @MessagePattern({ cmd: 'delete_complaint' })
  async remove(@Payload() id: number) {
    return await this.complaintService.remove(id);
  }

  @MessagePattern({ cmd: 'approve_complaint' })
  async approve(@Payload() id: number) {
    return await this.complaintService.approve(id);
  }

  @MessagePattern({ cmd: 'cancel_complaint' })
  async cancel(@Payload() id: number) {
    return await this.complaintService.cancel(id);
  }

  @MessagePattern({ cmd: 'vote_complaint' })
  async vote(@Payload() data: { id: number; voteType: 'for' | 'against' }) {
    return await this.complaintService.vote(data.id, data.voteType);
  }
}
