import { EntityManager, In } from "typeorm";
import { CampusEvent } from "../entity/campus-event.model";
import { CampusClub } from "../entity/campus-club.model";
import { CampusOpportunity } from "../entity/campus-opportunity.model";
import { CampusConnection, ConnectionStatus } from "../entity/campus-connection.model";
import { EventStatus } from "../entity/enums/event-status.enum";
import { OpportunityType } from "../entity/enums/opportunity-type.enum";
import { CampusDirectory } from "src/modules/user/entity/campus-directory.model";
import { UserAccount } from "src/modules/user/entity/user.model";
import { UserProfile } from "src/modules/user/entity/profile.model";

export class ConnectRepository {
  constructor(private readonly manager: EntityManager) {}

  async findEvents(status?: EventStatus): Promise<CampusEvent[]> {
    const qb = this.manager.getRepository(CampusEvent).createQueryBuilder("e");
    if (status) {
      qb.where("e.status = :status", { status });
    }
    qb.orderBy("e.starts_at", "ASC");
    return qb.getMany();
  }

  async createEvent(event: CampusEvent): Promise<CampusEvent> {
    return this.manager.getRepository(CampusEvent).save(event);
  }

  async findEventById(id: string): Promise<CampusEvent | null> {
    return this.manager.getRepository(CampusEvent).findOne({ where: { id } });
  }

  async findClubs(): Promise<CampusClub[]> {
    const repo = this.manager.getRepository(CampusClub);
    let clubs = await repo.find({
      where: { status: "ACTIVE" },
      order: { memberCount: "DESC" },
    });

    if (clubs.length === 0) {
      clubs = await this.seedDefaultClubs();
    }
    return clubs;
  }

  async findClubById(id: string): Promise<CampusClub | null> {
    return this.manager.getRepository(CampusClub).findOne({
      where: { id },
    });
  }

  async saveClub(club: CampusClub): Promise<CampusClub> {
    return this.manager.getRepository(CampusClub).save(club);
  }

  private async seedDefaultClubs(): Promise<CampusClub[]> {
    const repo = this.manager.getRepository(CampusClub);
    const defaults = [
      {
        id: "club-gdsc-01",
        name: "Google Developer Student Club (GDSC)",
        category: "Technical",
        description: "Google Developer Student Club is a university-based community group for students interested in Google developer technologies. Students grow their knowledge in a peer-to-peer learning environment and build solutions for local businesses and their community.",
        leadUserId: "lead-gdsc-01",
        leadName: "Ananya Sharma",
        meetingSchedule: "Wednesdays & Saturdays · 4:30 PM",
        roomOrVenue: "CS Seminar Hall 3, Academic Block 2",
        contactEmail: "gdsc@campus.edu",
        memberCount: 84,
        bannerKey: "gdsc-banner",
        status: "ACTIVE" as const,
        createdBy: "system",
        membersData: [
          { userId: "mem-gdsc-01", fullName: "Ananya Sharma", clubRole: "President & GDSC Lead", department: "Computer Science", batch: "2023-2027", usn: "1NT23CS018", initials: "AS", isLead: true },
          { userId: "mem-gdsc-02", fullName: "Rohan Verma", clubRole: "Technical Lead", department: "Information Science", batch: "2023-2027", usn: "1NT23IS045", initials: "RV", isLead: true },
          { userId: "mem-gdsc-03", fullName: "Sneha Kulkarni", clubRole: "Event & Operations Lead", department: "AI & Machine Learning", batch: "2024-2028", usn: "1NT24AI012", initials: "SK", isLead: false },
          { userId: "mem-gdsc-04", fullName: "Aditya Rao", clubRole: "Cloud & DevOps Head", department: "Computer Science", batch: "2023-2027", usn: "1NT23CS009", initials: "AR", isLead: false },
          { userId: "mem-gdsc-05", fullName: "Priya Nair", clubRole: "UI/UX Design Lead", department: "Electronics & Comm", batch: "2024-2028", usn: "1NT24EC033", initials: "PN", isLead: false },
          { userId: "mem-gdsc-06", fullName: "Vikram Patel", clubRole: "Mobile Development Lead", department: "Computer Science", batch: "2023-2027", usn: "1NT23CS098", initials: "VP", isLead: false },
          { userId: "mem-gdsc-07", fullName: "Meera Joshi", clubRole: "Active Member", department: "Data Science", batch: "2024-2028", usn: "1NT24DS015", initials: "MJ", isLead: false },
          { userId: "mem-gdsc-08", fullName: "Varun Bhat", clubRole: "Active Member", department: "Mechanical Engg", batch: "2023-2027", usn: "1NT23ME021", initials: "VB", isLead: false },
        ],
      },
      {
        id: "club-ieee-02",
        name: "IEEE Student Branch",
        category: "Research & Innovation",
        description: "The IEEE Student Branch fosters technological innovation and excellence for the benefit of humanity. Organizes research paper symposia, robotics bootcamps, international hackathons, and semiconductor design workshops.",
        leadUserId: "lead-ieee-02",
        leadName: "Karthik Sundaram",
        meetingSchedule: "Thursdays · 4:00 PM",
        roomOrVenue: "Advanced VLSI Lab, Room 402",
        contactEmail: "ieee.branch@campus.edu",
        memberCount: 65,
        bannerKey: "ieee-banner",
        status: "ACTIVE" as const,
        createdBy: "system",
        membersData: [
          { userId: "mem-ieee-01", fullName: "Karthik Sundaram", clubRole: "Chairperson", department: "Electronics & Comm", batch: "2023-2027", usn: "1NT23EC042", initials: "KS", isLead: true },
          { userId: "mem-ieee-02", fullName: "Divya Prakash", clubRole: "Vice Chairperson", department: "Electrical & Electronics", batch: "2023-2027", usn: "1NT23EE015", initials: "DP", isLead: true },
          { userId: "mem-ieee-03", fullName: "Rahul Shenoy", clubRole: "Secretary & Webmaster", department: "Computer Science", batch: "2024-2028", usn: "1NT24CS082", initials: "RS", isLead: false },
          { userId: "mem-ieee-04", fullName: "Naveen Hegde", clubRole: "Treasurer", department: "Electronics & Comm", batch: "2023-2027", usn: "1NT23EC029", initials: "NH", isLead: false },
          { userId: "mem-ieee-05", fullName: "Shweta Rao", clubRole: "Women in Engineering Lead", department: "Information Science", batch: "2024-2028", usn: "1NT24IS037", initials: "SR", isLead: false },
          { userId: "mem-ieee-06", fullName: "Arjun Das", clubRole: "Active Member", department: "Robotics Engg", batch: "2024-2028", usn: "1NT24RB004", initials: "AD", isLead: false },
        ],
      },
      {
        id: "club-rotaract-03",
        name: "Rotaract Club of Campus",
        category: "Social & Leadership",
        description: "Rotaract brings together students to exchange ideas with leaders in the community, develop leadership and professional skills, and have fun through service. Drives blood donation camps, clean campus drives, and orphanage mentoring programs.",
        leadUserId: "lead-rotaract-03",
        leadName: "Tanvi Kulkarni",
        meetingSchedule: "Fridays · 4:15 PM",
        roomOrVenue: "Student Center Amphitheater",
        contactEmail: "rotaract@campus.edu",
        memberCount: 92,
        bannerKey: "rotaract-banner",
        status: "ACTIVE" as const,
        createdBy: "system",
        membersData: [
          { userId: "mem-rot-01", fullName: "Tanvi Kulkarni", clubRole: "Club President", department: "Management Studies", batch: "2023-2027", usn: "1NT23MB011", initials: "TK", isLead: true },
          { userId: "mem-rot-02", fullName: "Yashaswini M", clubRole: "Community Service Director", department: "Civil Engineering", batch: "2023-2027", usn: "1NT23CV022", initials: "YM", isLead: true },
          { userId: "mem-rot-03", fullName: "Nihal Gowda", clubRole: "Youth Service Lead", department: "Computer Science", batch: "2024-2028", usn: "1NT24CS056", initials: "NG", isLead: false },
          { userId: "mem-rot-04", fullName: "Pooja Deshpande", clubRole: "Club Secretary", department: "Information Science", batch: "2024-2028", usn: "1NT24IS023", initials: "PD", isLead: false },
          { userId: "mem-rot-05", fullName: "Chetan Kumar", clubRole: "Treasurer", department: "Mechanical Engg", batch: "2023-2027", usn: "1NT23ME034", initials: "CK", isLead: false },
        ],
      },
      {
        id: "club-robotics-04",
        name: "Robotics & Automation Society (RAS)",
        category: "Hardware & Robotics",
        description: "Hands-on robotics lab community focused on autonomous drones, rover design, IoT microcontrollers, ROS2 navigation, and national combat robotics competitions.",
        leadUserId: "lead-robotics-04",
        leadName: "Darshan Gowda",
        meetingSchedule: "Tuesdays & Fridays · 5:00 PM",
        roomOrVenue: "Tinkering & Mechatronics Lab, Mechanical Block",
        contactEmail: "robotics.ras@campus.edu",
        memberCount: 58,
        bannerKey: "robotics-banner",
        status: "ACTIVE" as const,
        createdBy: "system",
        membersData: [
          { userId: "mem-rob-01", fullName: "Darshan Gowda", clubRole: "President & Hardware Lead", department: "Mechanical Engg", batch: "2023-2027", usn: "1NT23ME008", initials: "DG", isLead: true },
          { userId: "mem-rob-02", fullName: "Sanjana R", clubRole: "Firmware & Embedded Lead", department: "Electronics & Comm", batch: "2023-2027", usn: "1NT23EC067", initials: "SR", isLead: true },
          { userId: "mem-rob-03", fullName: "Abhishek Nayak", clubRole: "CAD & Structural Lead", department: "Mechanical Engg", batch: "2024-2028", usn: "1NT24ME003", initials: "AN", isLead: false },
          { userId: "mem-rob-04", fullName: "Tejaswini Rao", clubRole: "Computer Vision Lead", department: "AI & Machine Learning", batch: "2023-2027", usn: "1NT23AI024", initials: "TR", isLead: false },
          { userId: "mem-rob-05", fullName: "Manoj Prasad", clubRole: "Active Member", department: "Automobile Engg", batch: "2024-2028", usn: "1NT24AU019", initials: "MP", isLead: false },
        ],
      },
      {
        id: "club-ecell-05",
        name: "E-Cell Entrepreneurship Hub",
        category: "Business & Startups",
        description: "Campus startup incubator and investor pitching platform. Helps student founders transform ideas into scalable business ventures through venture pitch fests and founder roundtables.",
        leadUserId: "lead-ecell-05",
        leadName: "Samarth Mehta",
        meetingSchedule: "Mondays & Thursdays · 4:30 PM",
        roomOrVenue: "Incubation Center, Ground Floor",
        contactEmail: "ecell@campus.edu",
        memberCount: 76,
        bannerKey: "ecell-banner",
        status: "ACTIVE" as const,
        createdBy: "system",
        membersData: [
          { userId: "mem-ecell-01", fullName: "Samarth Mehta", clubRole: "Head Coordinator & Founder", department: "Computer Science", batch: "2023-2027", usn: "1NT23CS090", initials: "SM", isLead: true },
          { userId: "mem-ecell-02", fullName: "Aayushi Singh", clubRole: "Incubation Lead", department: "Management Studies", batch: "2023-2027", usn: "1NT23MB004", initials: "AS", isLead: true },
          { userId: "mem-ecell-03", fullName: "Ritesh Mittal", clubRole: "Finance & Pitch Coordinator", department: "Information Science", batch: "2024-2028", usn: "1NT24IS049", initials: "RM", isLead: false },
          { userId: "mem-ecell-04", fullName: "Shreya Hegde", clubRole: "Corporate Outreach Lead", department: "Electronics & Comm", batch: "2023-2027", usn: "1NT23EC081", initials: "SH", isLead: false },
        ],
      },
      {
        id: "club-taarang-06",
        name: "Taarang Cultural & Performing Arts",
        category: "Cultural & Arts",
        description: "The vibrant heart of campus music, classical and contemporary dance, dramatics, stand-up comedy, and acoustic bands. Hosts annual inter-collegiate fest and evening jam sessions.",
        leadUserId: "lead-taarang-06",
        leadName: "Keerthana S",
        meetingSchedule: "Monday to Friday · 5:00 PM",
        roomOrVenue: "Main Auditorium & Open Amphitheater",
        contactEmail: "taarang.arts@campus.edu",
        memberCount: 110,
        bannerKey: "taarang-banner",
        status: "ACTIVE" as const,
        createdBy: "system",
        membersData: [
          { userId: "mem-taa-01", fullName: "Keerthana S", clubRole: "Cultural Secretary", department: "Architecture", batch: "2023-2028", usn: "1NT23AR014", initials: "KS", isLead: true },
          { userId: "mem-taa-02", fullName: "Pranav Mohan", clubRole: "Music & Band Head", department: "Computer Science", batch: "2023-2027", usn: "1NT23CS061", initials: "PM", isLead: true },
          { userId: "mem-taa-03", fullName: "Lavanya Krishnan", clubRole: "Dance Coordinator", department: "AI & Machine Learning", batch: "2024-2028", usn: "1NT24AI029", initials: "LK", isLead: false },
          { userId: "mem-taa-04", fullName: "Gautam Iyer", clubRole: "Dramatics Lead", department: "Mechanical Engg", batch: "2023-2027", usn: "1NT23ME017", initials: "GI", isLead: false },
          { userId: "mem-taa-05", fullName: "Rithika S", clubRole: "Design & Stage Decor Head", department: "Civil Engineering", batch: "2024-2028", usn: "1NT24CV018", initials: "RS", isLead: false },
        ],
      },
    ];

    const savedList: CampusClub[] = [];
    for (const d of defaults) {
      const c = new CampusClub();
      Object.assign(c, d);
      savedList.push(await repo.save(c));
    }
    return savedList;
  }

  async findOpportunities(type?: OpportunityType): Promise<CampusOpportunity[]> {
    const where: any = {};
    if (type) {
      where.type = type;
    }
    return this.manager.getRepository(CampusOpportunity).find({
      where,
      order: { createdAt: "DESC" },
    });
  }

  async createOpportunity(opportunity: CampusOpportunity): Promise<CampusOpportunity> {
    return this.manager.getRepository(CampusOpportunity).save(opportunity);
  }

  async searchMembers(options: {
    role?: string;
    batch?: string;
    query?: string;
  }): Promise<Array<{ user: UserAccount; directory: CampusDirectory; profile: UserProfile | null }>> {
    const dirQb = this.manager.getRepository(CampusDirectory).createQueryBuilder("d");

    if (options.role && options.role.toLowerCase() !== "all") {
      const r = options.role.toUpperCase();
      if (r === "ALUMNI") {
        dirQb.andWhere("d.role = 'ALUMNI'");
      } else if (r === "STUDENTS" || r === "STUDENT") {
        dirQb.andWhere("d.role = 'STUDENT'");
      } else if (r === "FACULTY") {
        dirQb.andWhere("d.role = 'FACULTY'");
      }
    }

    if (options.batch && options.batch.toLowerCase() !== "all" && options.batch.toLowerCase() !== "all batches") {
      dirQb.andWhere("d.batch = :batch", { batch: options.batch.trim() });
    }

    if (options.query && options.query.trim()) {
      const q = `%${options.query.trim().toLowerCase()}%`;
      dirQb.andWhere("(LOWER(d.fullName) LIKE :q OR LOWER(d.usn) LIKE :q OR LOWER(d.collegeEmail) LIKE :q)", { q });
    }

    dirQb.orderBy("d.fullName", "ASC").take(50);
    const directories = await dirQb.getMany();
    if (!directories.length) return [];

    const dirIds = directories.map((d) => d.id);
    const users = await this.manager.getRepository(UserAccount).find({
      where: {
        directoryId: In(dirIds),
        status: "active" as any,
      },
    });

    const userIds = users.map((u) => u.id);
    const profiles = userIds.length
      ? await this.manager.getRepository(UserProfile).find({
          where: { userId: In(userIds) },
          select: ["id", "userId", "photoKey"],
        })
      : [];

    const profileMap = new Map(profiles.map((p) => [p.userId, p]));
    const userMap = new Map(users.map((u) => [u.directoryId, u]));

    const results: Array<{ user: UserAccount; directory: CampusDirectory; profile: UserProfile | null }> = [];
    directories.forEach((d) => {
      const u = userMap.get(d.id);
      if (u) {
        results.push({
          user: u,
          directory: d,
          profile: profileMap.get(u.id) || null,
        });
      }
    });

    return results;
  }

  async findMemberById(
    userId: string,
  ): Promise<{ user: UserAccount; directory: CampusDirectory; profile: UserProfile | null } | null> {
    const user = await this.manager.getRepository(UserAccount).findOne({
      where: { id: userId },
    });
    if (!user || !user.directoryId) return null;

    const directory = await this.manager.getRepository(CampusDirectory).findOne({
      where: { id: user.directoryId },
    });
    if (!directory) return null;

    const profile = await this.manager.getRepository(UserProfile).findOne({
      where: { userId },
    });

    return { user, directory, profile };
  }

  private async ensureConnectionTable(): Promise<void> {
    try {
      await this.manager.query(`
        CREATE TABLE IF NOT EXISTS \`campus_connection\` (
          \`id\` VARCHAR(36) NOT NULL,
          \`requester_user_id\` VARCHAR(36) NOT NULL,
          \`receiver_user_id\` VARCHAR(36) NOT NULL,
          \`status\` ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
          \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uk_connection_pair\` (\`requester_user_id\`, \`receiver_user_id\`),
          INDEX \`idx_conn_receiver\` (\`receiver_user_id\`, \`status\`),
          INDEX \`idx_conn_requester\` (\`requester_user_id\`, \`status\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    } catch {
      // Table already exists or fallback safely
    }
  }

  async findConnection(
    requesterId: string,
    receiverId: string,
  ): Promise<CampusConnection | null> {
    await this.ensureConnectionTable();
    try {
      return await this.manager.getRepository(CampusConnection).findOne({
        where: [
          { requesterUserId: requesterId, receiverUserId: receiverId },
          { requesterUserId: receiverId, receiverUserId: requesterId },
        ],
      });
    } catch {
      return null;
    }
  }

  async saveConnection(connection: CampusConnection): Promise<CampusConnection> {
    await this.ensureConnectionTable();
    return this.manager.getRepository(CampusConnection).save(connection);
  }

  async findConnectionsForUser(userId: string): Promise<CampusConnection[]> {
    await this.ensureConnectionTable();
    try {
      return await this.manager.getRepository(CampusConnection).find({
        where: [
          { requesterUserId: userId },
          { receiverUserId: userId },
        ],
      });
    } catch {
      return [];
    }
  }

  async findIncomingRequests(
    receiverUserId: string,
  ): Promise<
    Array<{
      connection: CampusConnection;
      user: UserAccount;
      directory: CampusDirectory;
      profile: UserProfile | null;
    }>
  > {
    await this.ensureConnectionTable();
    try {
      const requests = await this.manager.getRepository(CampusConnection).find({
        where: {
          receiverUserId,
          status: ConnectionStatus.PENDING,
        },
        order: { createdAt: "DESC" },
      });
      if (!requests.length) return [];

      const requesterUserIds = requests.map((r) => r.requesterUserId);
      const users = await this.manager.getRepository(UserAccount).find({
        where: { id: In(requesterUserIds) },
      });
      const dirIds = users.map((u) => u.directoryId).filter(Boolean) as string[];
      const directories = dirIds.length
        ? await this.manager.getRepository(CampusDirectory).find({
            where: { id: In(dirIds) },
          })
        : [];
      const profiles = await this.manager.getRepository(UserProfile).find({
        where: { userId: In(requesterUserIds) },
      });

      const userMap = new Map(users.map((u) => [u.id, u]));
      const dirMap = new Map(directories.map((d) => [d.id, d]));
      const profileMap = new Map(profiles.map((p) => [p.userId, p]));

      const results: Array<{
        connection: CampusConnection;
        user: UserAccount;
        directory: CampusDirectory;
        profile: UserProfile | null;
      }> = [];

      requests.forEach((conn) => {
        const u = userMap.get(conn.requesterUserId);
        if (u) {
          const d = dirMap.get(u.directoryId);
          if (d) {
            results.push({
              connection: conn,
              user: u,
              directory: d,
              profile: profileMap.get(u.id) || null,
            });
          }
        }
      });

      return results;
    } catch {
      return [];
    }
  }

  async findConnectionById(id: string): Promise<CampusConnection | null> {
    await this.ensureConnectionTable();
    try {
      return await this.manager.getRepository(CampusConnection).findOne({
        where: { id },
      });
    } catch {
      return null;
    }
  }

  async updateConnectionStatus(
    id: string,
    status: ConnectionStatus,
  ): Promise<CampusConnection | null> {
    await this.ensureConnectionTable();
    const conn = await this.findConnectionById(id);
    if (!conn) return null;
    conn.status = status;
    return this.manager.getRepository(CampusConnection).save(conn);
  }

  async findAcceptedConnections(
    userId: string,
  ): Promise<
    Array<{
      connection: CampusConnection;
      user: UserAccount;
      directory: CampusDirectory;
      profile: UserProfile | null;
    }>
  > {
    await this.ensureConnectionTable();
    try {
      const connections = await this.manager.getRepository(CampusConnection).find({
        where: [
          { requesterUserId: userId, status: ConnectionStatus.ACCEPTED },
          { receiverUserId: userId, status: ConnectionStatus.ACCEPTED },
        ],
      });
      if (!connections.length) return [];

      const otherUserIds = connections.map((c) =>
        c.requesterUserId === userId ? c.receiverUserId : c.requesterUserId,
      );
      const users = await this.manager.getRepository(UserAccount).find({
        where: { id: In(otherUserIds) },
      });
      const dirIds = users.map((u) => u.directoryId).filter(Boolean) as string[];
      const directories = dirIds.length
        ? await this.manager.getRepository(CampusDirectory).find({
            where: { id: In(dirIds) },
          })
        : [];
      const profiles = await this.manager.getRepository(UserProfile).find({
        where: { userId: In(otherUserIds) },
      });

      const userMap = new Map(users.map((u) => [u.id, u]));
      const dirMap = new Map(directories.map((d) => [d.id, d]));
      const profileMap = new Map(profiles.map((p) => [p.userId, p]));

      const results: Array<{
        connection: CampusConnection;
        user: UserAccount;
        directory: CampusDirectory;
        profile: UserProfile | null;
      }> = [];

      connections.forEach((conn) => {
        const otherId =
          conn.requesterUserId === userId ? conn.receiverUserId : conn.requesterUserId;
        const u = userMap.get(otherId);
        if (u) {
          const d = dirMap.get(u.directoryId);
          if (d) {
            results.push({
              connection: conn,
              user: u,
              directory: d,
              profile: profileMap.get(u.id) || null,
            });
          }
        }
      });

      return results;
    } catch {
      return [];
    }
  }
}
