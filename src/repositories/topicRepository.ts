import { Topic, TopicStatus } from '../types/academic';
import { SubjectRepository, subjectRepository } from './subjectRepository';

export interface TopicRepository {
  getAll(): Topic[];
  getBySubjectId(subjectId: string): Topic[];
  getById(id: string): Topic | null;
  updateStatus(topicId: string, status: TopicStatus): void;
  save(topic: Topic): void;
}

export class LocalTopicRepository implements TopicRepository {
  private subjectRepo: SubjectRepository;

  constructor(subjectRepo: SubjectRepository = subjectRepository) {
    this.subjectRepo = subjectRepo;
  }

  getAll(): Topic[] {
    const subjects = this.subjectRepo.getAll();
    return subjects.flatMap((s) => s.topics);
  }

  getBySubjectId(subjectId: string): Topic[] {
    const subject = this.subjectRepo.getById(subjectId);
    return subject ? subject.topics : [];
  }

  getById(id: string): Topic | null {
    const allTopics = this.getAll();
    return allTopics.find((t) => t.id === id) || null;
  }

  updateStatus(topicId: string, status: TopicStatus): void {
    const subjects = this.subjectRepo.getAll();
    let modified = false;

    for (const subject of subjects) {
      const topic = subject.topics.find((t) => t.id === topicId);
      if (topic) {
        topic.status = status;
        modified = true;
        break;
      }
    }

    if (modified) {
      this.subjectRepo.saveAll(subjects);
    }
  }

  save(topic: Topic): void {
    const subjects = this.subjectRepo.getAll();
    const subject = subjects.find((s) => s.id === topic.subjectId);

    if (subject) {
      const index = subject.topics.findIndex((t) => t.id === topic.id);
      if (index !== -1) {
        subject.topics[index] = topic;
      } else {
        subject.topics.push(topic);
      }
      this.subjectRepo.saveAll(subjects);
    }
  }
}

export const topicRepository = new LocalTopicRepository();
