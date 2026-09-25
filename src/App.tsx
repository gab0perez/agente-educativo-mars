import { useState, useEffect } from 'react';
import { AppShell } from './components/layout/AppShell/AppShell';
import { NavTabId } from './components/layout/BottomNav/BottomNav';
import { HomeView } from './views/HomeView/HomeView';
import { SubjectsView } from './views/SubjectsView/SubjectsView';
import { LessonView } from './views/LessonView/LessonView';
import { NotesView } from './views/NotesView';
import { TutorView } from './views/TutorView';
import { Lesson } from './types/lesson';
import { Subject, Topic } from './types/academic';
import { AcademicContextSelection } from './tutor/academic/academicContextTypes';
import { initializeLocalStorage, lessonRepository, subjectRepository } from './repositories';
import { PracticeView } from './practice';
import { TasksView } from './views/TasksView';
import { ExamView, createOrGetExamForTopic, ExamConfig } from './exam';
import { PracticeActivity } from './learning/domain/types';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTabId>('home');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>(undefined);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activePractice, setActivePractice] = useState<{ subject?: Subject; topic?: Topic } | null>(null);
  const [activeExam, setActiveExam] = useState<{ config: ExamConfig; activities: PracticeActivity[] } | null>(null);
  const [tutorSelection, setTutorSelection] = useState<AcademicContextSelection | null>(null);

  // Inicialización idempotente del almacenamiento local en arranque
  useEffect(() => {
    initializeLocalStorage();
  }, []);

  const handleNavigate = (tab: NavTabId, subjectId?: string) => {
    setActiveTab(tab);
    setActiveLesson(null);
    setActivePractice(null);
    setActiveExam(null);
    if (subjectId) {
      setSelectedSubjectId(subjectId);
    } else {
      setSelectedSubjectId(undefined);
    }
  };

  const openLessonForTopic = (topicId: string) => {
    const lesson = lessonRepository.getByTopicId(topicId) || lessonRepository.getById('leccion-sinergia');
    if (lesson) {
      setActiveLesson(lesson);
      setActivePractice(null);
      setActiveExam(null);
    }
  };

  const openTutorForContext = (selection: AcademicContextSelection) => {
    setTutorSelection(selection);
    setActiveLesson(null);
    setActivePractice(null);
    setActiveExam(null);
    setActiveTab('tutor');
  };

  const renderContent = () => {
    // Si hay un examen activo, se muestra ExamView con prioridad
    if (activeExam) {
      return (
        <ExamView
          config={activeExam.config}
          activities={activeExam.activities}
          onExit={() => setActiveExam(null)}
          onGoToPractice={() => {
            const topicId = activeExam.config.topicId;
            const subj = activeExam.config.subjectId ? subjectRepository.getById(activeExam.config.subjectId) : null;
            const topic = subj?.topics.find((t) => t.id === topicId);
            setActiveExam(null);
            if (topic) {
              setActivePractice({ subject: subj || undefined, topic });
            }
          }}
          onGoToTopics={() => {
            const subjId = activeExam.config.subjectId;
            setActiveExam(null);
            handleNavigate('subjects', subjId);
          }}
          onGoHome={() => {
            setActiveExam(null);
            handleNavigate('home');
          }}
        />
      );
    }

    // Si hay una sesión de práctica activa, se muestra PracticeView con prioridad
    if (activePractice) {
      return (
        <PracticeView
          subject={activePractice.subject}
          topic={activePractice.topic}
          onBack={() => setActivePractice(null)}
          onComplete={() => setActivePractice(null)}
        />
      );
    }

    // Si hay una lección activa, se muestra LessonView con prioridad
    if (activeLesson) {
      return (
        <LessonView
          lesson={activeLesson}
          onBack={() => setActiveLesson(null)}
          onGoHome={() => handleNavigate('home')}
          onConsultTutor={(lesson, reflectionText) => {
            openTutorForContext({
              subjectId: lesson.subjectId,
              topicId: lesson.topicId,
              lessonId: lesson.id,
              studentReflectionText: reflectionText
            });
          }}
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <HomeView
            onNavigate={(tab) => {
              if (tab === 'subjects') {
                handleNavigate('subjects', 'ciencias-3');
              } else {
                handleNavigate(tab);
              }
            }}
            onOpenLesson={(lessonId) => {
              const lesson = lessonRepository.getById(lessonId) || lessonRepository.getById('leccion-sinergia');
              if (lesson) {
                setActiveLesson(lesson);
              }
            }}
            onOpenPractice={(topicId) => {
              const subj = subjectRepository.getById('ciencias-3');
              const topic = subj?.topics.find((t) => t.id === topicId) || subj?.topics[0];
              setActivePractice({ subject: subj || undefined, topic });
            }}
          />
        );
      case 'subjects':
        return (
          <SubjectsView
            initialSelectedSubjectId={selectedSubjectId}
            onSelectTopic={(topic) => {
              // Abre la lección correspondiente desde la capa de repositorios
              openLessonForTopic(topic.id);
            }}
            onAskTutor={(topic) => {
              openTutorForContext({
                subjectId: selectedSubjectId || topic.subjectId,
                topicId: topic.id
              });
            }}
            onPracticeTopic={(topic) => {
              const subj = subjectRepository.getById(topic.subjectId) || (selectedSubjectId ? subjectRepository.getById(selectedSubjectId) : null);
              setActivePractice({ subject: subj || undefined, topic });
            }}
            onExamTopic={(topic) => {
              const subj = subjectRepository.getById(topic.subjectId) || (selectedSubjectId ? subjectRepository.getById(selectedSubjectId) : null);
              const examData = createOrGetExamForTopic(topic, subj || undefined);
              setActiveExam(examData);
            }}
          />
        );
      case 'notes':
        return (
          <NotesView
            onAskTutor={(note) => {
              openTutorForContext({
                subjectId: note.subjectId,
                topicId: note.topicId,
                selectedNoteIds: [note.id],
                activeNoteId: note.id
              });
            }}
          />
        );
      case 'tasks':
        return (
          <TasksView
            onOpenPractice={(topicId) => {
              const allSubjects = subjectRepository.getAll();
              const subj = allSubjects.find((s) => s.topics.some((t) => t.id === topicId));
              const topic = subj?.topics.find((t) => t.id === topicId);
              setActivePractice({ subject: subj || undefined, topic });
            }}
            onAskTutor={(subjectId, topicId) => {
              openTutorForContext({
                subjectId,
                topicId
              });
            }}
            onOpenLesson={(topicId) => {
              openLessonForTopic(topicId);
            }}
          />
        );
      case 'tutor': {
        const defaultSubject = selectedSubjectId
          ? subjectRepository.getById(selectedSubjectId)
          : subjectRepository.getById('ciencias-3');
        const defaultTopic = defaultSubject?.topics?.find((t) => t.status === 'en_estudio') || defaultSubject?.topics?.[0];

        return (
          <TutorView
            initialSelection={
              tutorSelection || {
                subjectId: defaultSubject?.id,
                topicId: defaultTopic?.id
              }
            }
            onBack={() => {
              setTutorSelection(null);
              handleNavigate('home');
            }}
          />
        );
      }
      default:
        return (
          <HomeView
            onNavigate={(tab) => handleNavigate(tab)}
            onOpenLesson={(lessonId) => {
              const lesson = lessonRepository.getById(lessonId) || lessonRepository.getById('leccion-sinergia');
              if (lesson) {
                setActiveLesson(lesson);
              }
            }}
          />
        );
    }
  };

  return (
    <AppShell activeTab={activeTab} onTabChange={(tab) => handleNavigate(tab)}>
      {renderContent()}
    </AppShell>
  );
}
