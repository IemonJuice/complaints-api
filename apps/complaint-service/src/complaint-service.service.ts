import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complaint, ComplaintStatus } from './entities/complaint.entity';
import { CreateComplaintDto, UpdateComplaintDto } from './complaint.dto';

@Injectable()
export class ComplaintServiceService {
  constructor(
    @InjectRepository(Complaint)
    private readonly complaintRepository: Repository<Complaint>,
  ) {}

  async create(dto: CreateComplaintDto): Promise<Complaint> {
    const complaint = this.complaintRepository.create({
      ...dto,
      status: ComplaintStatus.PENDING,
    });
    return await this.complaintRepository.save(complaint);
  }

  async findAll(): Promise<Complaint[]> {
    return await this.complaintRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Complaint> {
    const complaint = await this.complaintRepository.findOne({
      where: { id },
    });

    if (!complaint) {
      throw new HttpException('Complaint not found', HttpStatus.NOT_FOUND);
    }

    return complaint;
  }

  async update(id: number, dto: UpdateComplaintDto): Promise<Complaint> {
    const complaint = await this.findOne(id);
    Object.assign(complaint, dto);
    return await this.complaintRepository.save(complaint);
  }

  async remove(id: number): Promise<{ message: string }> {
    const complaint = await this.findOne(id);
    await this.complaintRepository.remove(complaint);
    return { message: 'Complaint deleted successfully' };
  }

  async approve(id: number): Promise<Complaint> {
    const complaint = await this.findOne(id);
    complaint.status = ComplaintStatus.APPROVED;
    return await this.complaintRepository.save(complaint);
  }

  async cancel(id: number): Promise<Complaint> {
    const complaint = await this.findOne(id);
    complaint.status = ComplaintStatus.CANCELLED;
    return await this.complaintRepository.save(complaint);
  }

  async vote(id: number, voteType: 'for' | 'against'): Promise<Complaint> {
    const complaint = await this.findOne(id);

    if (voteType === 'for') {
      complaint.votesFor += 1;
    } else {
      complaint.votesAgainst += 1;
    }

    return await this.complaintRepository.save(complaint);
  }
}
