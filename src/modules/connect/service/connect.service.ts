import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { JwtPayload } from "src/core/common/decorators/current-user.decorator";
import { TenantContextService } from "src/core/tenant/tenant-context.service";
import { ConnectDataService } from "./connect-data.service";
import { CampusEvent } from "../entity/campus-event.model";
import { CampusOpportunity } from "../entity/campus-opportunity.model";
import { CampusConnection, ConnectionStatus } from "../entity/campus-connection.model";
import { EventStatus } from "../entity/enums/event-status.enum";
import { OpportunityType } from "../entity/enums/opportunity-type.enum";
import { CreateEventReqDto } from "../dto/request/create-event.req.dto";
import { CreateOpportunityReqDto } from "../dto/request/create-opportunity.req.dto";
import { CampusEventResDto } from "../dto/response/campus-event.res.dto";
import { CampusClubResDto } from "../dto/response/campus-club.res.dto";
import { CampusOpportunityResDto } from "../dto/response/campus-opportunity.res.dto";
import { ConnectMemberResDto } from "../dto/response/connect-member.res.dto";
import { IncomingConnectionResDto } from "../dto/response/incoming-connection.res.dto";

@Injectable()
export class ConnectService {
  constructor(
    private readonly data: ConnectDataService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private get namespace(): string {
    return this.tenantContext.getTenantId();
  }

  private initials(name: string): string {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  private formatDate(date: Date): string {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = new Date(date);
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  private formatTime(date: Date): string {
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }

  async getEvents(): Promise<CampusEventResDto[]> {
    const list = await this.data.findEvents(this.namespace);
    return list.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      venue: e.venue,
      startsAt: new Date(e.startsAt).toISOString(),
      endsAt: new Date(e.endsAt).toISOString(),
      capacity: e.capacity,
      registeredCount: e.registeredCount,
      bannerKey: e.bannerKey,
      status: e.status,
      formattedDate: this.formatDate(e.startsAt),
      formattedTime: `${this.formatTime(e.startsAt)} - ${this.formatTime(e.endsAt)}`,
      createdBy: e.createdBy,
    }));
  }

  async createEvent(userId: string, body: CreateEventReqDto): Promise<CampusEventResDto> {
    const startDate = new Date(body.startsAt);
    const endDate = new Date(body.endsAt);

    if (isNaN(startDate.getTime())) {
      throw new BadRequestException("Invalid event start date/time");
    }
    if (isNaN(endDate.getTime())) {
      throw new BadRequestException("Invalid event end date/time");
    }
    if (endDate <= startDate) {
      throw new BadRequestException("Event end time must be after start time");
    }

    const event = new CampusEvent();
    event.id = randomUUID();
    event.title = body.title.trim();
    event.description = body.description.trim();
    event.venue = body.venue.trim();
    event.startsAt = startDate;
    event.endsAt = endDate;
    event.capacity = body.capacity ?? null;
    event.registeredCount = 0;
    event.bannerKey = null;
    event.status = EventStatus.UPCOMING;
    event.createdBy = userId;

    const saved = await this.data.createEvent(this.namespace, event);

    return {
      id: saved.id,
      title: saved.title,
      description: saved.description,
      venue: saved.venue,
      startsAt: new Date(saved.startsAt).toISOString(),
      endsAt: new Date(saved.endsAt).toISOString(),
      capacity: saved.capacity,
      registeredCount: saved.registeredCount,
      bannerKey: saved.bannerKey,
      status: saved.status,
      formattedDate: this.formatDate(saved.startsAt),
      formattedTime: `${this.formatTime(saved.startsAt)} - ${this.formatTime(saved.endsAt)}`,
      createdBy: saved.createdBy,
    };
  }

  async getClubs(userId?: string): Promise<CampusClubResDto[]> {
    const list = await this.data.findClubs(this.namespace);
    return list.map((c) => {
      const members = Array.isArray(c.membersData) ? c.membersData : [];
      const isJoined = Boolean(userId && members.some((m: any) => m.userId === userId));
      return {
        id: c.id,
        name: c.name,
        category: c.category,
        description: c.description,
        leadUserId: c.leadUserId,
        leadName: c.leadName,
        meetingSchedule: c.meetingSchedule,
        roomOrVenue: c.roomOrVenue,
        contactEmail: c.contactEmail,
        memberCount: c.memberCount,
        bannerKey: c.bannerKey,
        status: c.status,
        isJoined,
        members,
      };
    });
  }

  async getClubDetails(clubId: string, userId?: string): Promise<CampusClubResDto> {
    const club = await this.data.findClubById(this.namespace, clubId);
    if (!club) {
      throw new NotFoundException("Club not found");
    }

    const members = Array.isArray(club.membersData) ? club.membersData : [];
    const isJoined = Boolean(userId && members.some((m: any) => m.userId === userId));

    return {
      id: club.id,
      name: club.name,
      category: club.category,
      description: club.description,
      leadUserId: club.leadUserId,
      leadName: club.leadName,
      meetingSchedule: club.meetingSchedule,
      roomOrVenue: club.roomOrVenue,
      contactEmail: club.contactEmail,
      memberCount: club.memberCount,
      bannerKey: club.bannerKey,
      status: club.status,
      isJoined,
      members,
    };
  }

  async toggleJoinClub(clubId: string, user: JwtPayload): Promise<CampusClubResDto> {
    const club = await this.data.findClubById(this.namespace, clubId);
    if (!club) {
      throw new NotFoundException("Club not found");
    }

    let members = Array.isArray(club.membersData) ? [...club.membersData] : [];
    const index = members.findIndex((m: any) => m.userId === user.sub);

    let isJoined: boolean;
    if (index >= 0) {
      // Leave club
      members.splice(index, 1);
      club.memberCount = Math.max(club.memberCount - 1, members.length);
      isJoined = false;
    } else {
      // Join club
      const userEmailPrefix = user.email ? user.email.split("@")[0] : "Student";
      let fullName = userEmailPrefix;
      let usn = null;

      try {
        const dirInfo = await this.data.findMemberById(this.namespace, user.sub);
        if (dirInfo?.directory?.fullName) {
          fullName = dirInfo.directory.fullName;
          usn = dirInfo.directory.usn || null;
        }
      } catch {
        // Fallback to email name
      }

      const initials = fullName
        .split(" ")
        .map((p: string) => p.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();

      members.push({
        userId: user.sub,
        fullName,
        clubRole: "Active Member",
        department: "Engineering",
        batch: "2024",
        usn,
        initials,
        isLead: false,
      });

      club.memberCount = Math.max(club.memberCount + 1, members.length);
      isJoined = true;
    }

    club.membersData = members;
    const saved = await this.data.saveClub(this.namespace, club);

    return {
      id: saved.id,
      name: saved.name,
      category: saved.category,
      description: saved.description,
      leadUserId: saved.leadUserId,
      leadName: saved.leadName,
      meetingSchedule: saved.meetingSchedule,
      roomOrVenue: saved.roomOrVenue,
      contactEmail: saved.contactEmail,
      memberCount: saved.memberCount,
      bannerKey: saved.bannerKey,
      status: saved.status,
      isJoined,
      members,
    };
  }

  async getOpportunities(type?: OpportunityType): Promise<CampusOpportunityResDto[]> {
    const list = await this.data.findOpportunities(this.namespace, type);
    return list.map((o) => ({
      id: o.id,
      title: o.title,
      company: o.company,
      type: o.type,
      location: o.location,
      stipendOrSalary: o.stipendOrSalary,
      description: o.description,
      applyUrl: o.applyUrl,
      deadline: o.deadline ? new Date(o.deadline).toISOString() : null,
    }));
  }

  async createOpportunity(userId: string, body: CreateOpportunityReqDto): Promise<CampusOpportunityResDto> {
    let deadlineDate: Date | null = null;
    if (body.deadline && body.deadline.trim()) {
      deadlineDate = new Date(body.deadline.trim());
      if (isNaN(deadlineDate.getTime())) {
        deadlineDate = null;
      }
    }

    let fullDescription = body.description.trim();
    if (body.skillsAndEligibility && body.skillsAndEligibility.trim()) {
      fullDescription += `\n\nSkills & Eligibility:\n${body.skillsAndEligibility.trim()}`;
    }

    const opp = new CampusOpportunity();
    opp.id = randomUUID();
    opp.title = body.title.trim();
    opp.company = body.company.trim();
    opp.type = body.type;
    opp.location = body.location.trim();
    opp.stipendOrSalary = body.stipendOrSalary?.trim() || null;
    opp.description = fullDescription;
    opp.applyUrl = body.applyUrl?.trim() || null;
    opp.deadline = deadlineDate;
    opp.createdBy = userId;

    const saved = await this.data.createOpportunity(this.namespace, opp);

    return {
      id: saved.id,
      title: saved.title,
      company: saved.company,
      type: saved.type,
      location: saved.location,
      stipendOrSalary: saved.stipendOrSalary,
      description: saved.description,
      applyUrl: saved.applyUrl,
      deadline: saved.deadline ? new Date(saved.deadline).toISOString() : null,
    };
  }

  async getMembers(
    currentUserId?: string,
    options?: {
      role?: string;
      batch?: string;
      query?: string;
    },
  ): Promise<ConnectMemberResDto[]> {
    const list = await this.data.searchMembers(this.namespace, options || {});
    // Exclude the current user so they never see their own profile in discovery
    const filteredList = currentUserId
      ? list.filter((item) => item.user.id !== currentUserId)
      : list;

    let connections: CampusConnection[] = [];
    if (currentUserId) {
      try {
        connections = await this.data.findConnectionsForUser(this.namespace, currentUserId);
      } catch {
        connections = [];
      }
    }
    const connectionMap = new Map<
      string,
      { status: string; connectionId: string; isRequester: boolean }
    >();
    connections.forEach((c) => {
      const isRequester = c.requesterUserId === currentUserId;
      const otherId = isRequester ? c.receiverUserId : c.requesterUserId;
      connectionMap.set(otherId, {
        status: c.status,
        connectionId: c.id,
        isRequester,
      });
    });

    return filteredList.map(({ user, directory, profile }) => {
      const email = directory.collegeEmail || null;
      const handle = email
        ? `@${email.split("@")[0]}`
        : `@${directory.fullName.toLowerCase().replace(/\s+/g, "_")}`;

      const connInfo = connectionMap.get(user.id);
      let status: "NONE" | "PENDING" | "INCOMING_REQUEST" | "ACCEPTED" = "NONE";
      if (connInfo) {
        if (connInfo.status === ConnectionStatus.ACCEPTED) {
          status = "ACCEPTED";
        } else if (connInfo.status === ConnectionStatus.PENDING) {
          status = connInfo.isRequester ? "PENDING" : "INCOMING_REQUEST";
        }
      }

      return {
        userId: user.id,
        fullName: directory.fullName,
        role: directory.role,
        batch: directory.batch ? `Batch ${directory.batch}` : null,
        department: directory.department,
        initials: this.initials(directory.fullName),
        photoKey: profile?.photoKey ?? null,
        usn: directory.usn ?? null,
        program: directory.program ?? "Bachelor of Technology",
        email,
        handle,
        connectionId: connInfo?.connectionId ?? null,
        connectionStatus: status,
      };
    });
  }

  async getMemberById(
    currentUserId: string,
    targetUserId: string,
  ): Promise<ConnectMemberResDto> {
    const member = await this.data.findMemberById(this.namespace, targetUserId);
    if (!member) {
      throw new NotFoundException("Member not found");
    }

    const { user, directory, profile } = member;
    const email = directory.collegeEmail || null;
    const handle = email
      ? `@${email.split("@")[0]}`
      : `@${directory.fullName.toLowerCase().replace(/\s+/g, "_")}`;

    let status: "NONE" | "PENDING" | "INCOMING_REQUEST" | "ACCEPTED" = "NONE";
    let connectionId: string | null = null;
    try {
      const connection = await this.data.findConnection(
        this.namespace,
        currentUserId,
        targetUserId,
      );
      if (connection) {
        connectionId = connection.id;
        if (connection.status === ConnectionStatus.ACCEPTED) {
          status = "ACCEPTED";
        } else if (connection.status === ConnectionStatus.PENDING) {
          status = connection.requesterUserId === currentUserId ? "PENDING" : "INCOMING_REQUEST";
        }
      }
    } catch {
      status = "NONE";
    }

    return {
      userId: user.id,
      fullName: directory.fullName,
      role: directory.role,
      batch: directory.batch ? `Batch ${directory.batch}` : null,
      department: directory.department,
      initials: this.initials(directory.fullName),
      photoKey: profile?.photoKey ?? null,
      usn: directory.usn ?? null,
      program: directory.program ?? "Bachelor of Technology",
      email,
      handle,
      connectionId,
      connectionStatus: status,
    };
  }

  async connectWithMember(
    requesterId: string,
    receiverId: string,
  ): Promise<{ status: string; message: string }> {
    if (requesterId === receiverId) {
      throw new BadRequestException("You cannot connect with yourself");
    }

    const target = await this.data.findMemberById(this.namespace, receiverId);
    if (!target) {
      throw new NotFoundException("Target member does not exist");
    }

    const existing = await this.data.findConnection(
      this.namespace,
      requesterId,
      receiverId,
    );
    if (existing) {
      return {
        status: existing.status,
        message:
          existing.status === ConnectionStatus.ACCEPTED
            ? "Already connected"
            : "Connection request already pending",
      };
    }

    const conn = new CampusConnection();
    conn.id = randomUUID();
    conn.requesterUserId = requesterId;
    conn.receiverUserId = receiverId;
    conn.status = ConnectionStatus.PENDING;

    await this.data.saveConnection(this.namespace, conn);

    return {
      status: "PENDING",
      message: "Connection request sent",
    };
  }

  async getIncomingRequests(userId: string): Promise<IncomingConnectionResDto[]> {
    const list = await this.data.findIncomingRequests(this.namespace, userId);
    return list.map(({ connection, user, directory, profile }) => {
      const email = directory.collegeEmail || null;
      const handle = email
        ? `@${email.split("@")[0]}`
        : `@${directory.fullName.toLowerCase().replace(/\s+/g, "_")}`;

      return {
        connectionId: connection.id,
        requesterUserId: user.id,
        fullName: directory.fullName,
        role: directory.role,
        department: directory.department,
        batch: directory.batch ? `Batch ${directory.batch}` : null,
        program: directory.program ?? "Bachelor of Technology",
        initials: this.initials(directory.fullName),
        handle,
        photoKey: profile?.photoKey ?? null,
        createdAt: connection.createdAt ? new Date(connection.createdAt).toISOString() : new Date().toISOString(),
      };
    });
  }

  async respondToConnectionRequest(
    userId: string,
    connectionId: string,
    action: "ACCEPT" | "DECLINE",
  ): Promise<{ status: string; message: string }> {
    const conn = await this.data.findConnectionById(this.namespace, connectionId);
    if (!conn) {
      throw new NotFoundException("Connection request not found");
    }
    if (conn.receiverUserId !== userId) {
      throw new BadRequestException("You are not the recipient of this connection request");
    }

    const nextStatus = action === "ACCEPT" ? ConnectionStatus.ACCEPTED : ConnectionStatus.REJECTED;
    await this.data.updateConnectionStatus(this.namespace, connectionId, nextStatus);

    return {
      status: nextStatus,
      message: action === "ACCEPT" ? "Connection accepted!" : "Connection declined",
    };
  }

  async getMyConnections(userId: string): Promise<ConnectMemberResDto[]> {
    const list = await this.data.findAcceptedConnections(this.namespace, userId);
    return list.map(({ user, directory, profile }) => {
      const email = directory.collegeEmail || null;
      const handle = email
        ? `@${email.split("@")[0]}`
        : `@${directory.fullName.toLowerCase().replace(/\s+/g, "_")}`;

      return {
        userId: user.id,
        fullName: directory.fullName,
        role: directory.role,
        batch: directory.batch ? `Batch ${directory.batch}` : null,
        department: directory.department,
        initials: this.initials(directory.fullName),
        photoKey: profile?.photoKey ?? null,
        usn: directory.usn ?? null,
        program: directory.program ?? "Bachelor of Technology",
        email,
        handle,
        connectionStatus: "ACCEPTED",
      };
    });
  }
}
