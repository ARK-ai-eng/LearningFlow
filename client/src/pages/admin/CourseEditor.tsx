import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, BookOpen, Plus, Trash2, ChevronDown, ChevronRight, Save } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

export default function CourseEditor() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const isNew = id === 'new' || !id;
  const courseId = isNew ? 0 : parseInt(id);

  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    courseType: "learning" as "learning" | "sensitization" | "certification",
    isActive: true,
    isMandatory: false,
    passingScore: 80,
    timeLimit: 15,
  });

  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [editingQuestion, setEditingQuestion] = useState<{
    topicId: number;
    question?: any;
  } | null>(null);

  const { data: course, refetch } = trpc.course.get.useQuery(
    { id: courseId },
    { enabled: courseId > 0 }
  );

  useEffect(() => {
    if (course) {
      setCourseData({
        title: course.title,
        description: course.description || "",
        courseType: course.courseType,
        isActive: course.isActive,
        isMandatory: course.isMandatory,
        passingScore: course.passingScore || 80,
        timeLimit: course.timeLimit || 15,
      });
    }
  }, [course]);

  const createCourseMutation = trpc.course.create.useMutation({
    onSuccess: (data) => {
      toast.success("Kurs erstellt");
      setLocation(`/admin/courses/${data.id}`);
    },
  });

  const updateCourseMutation = trpc.course.update.useMutation({
    onSuccess: () => {
      toast.success("Kurs aktualisiert");
      refetch();
    },
  });

  const createTopicMutation = trpc.topic.create.useMutation({
    onSuccess: () => {
      toast.success("Thema hinzugefügt");
      setNewTopicTitle("");
      refetch();
    },
  });

  const deleteTopicMutation = trpc.topic.delete.useMutation({
    onSuccess: () => {
      toast.success("Thema gelöscht");
      refetch();
    },
  });

  const createQuestionMutation = trpc.question.create.useMutation({
    onSuccess: () => {
      toast.success("Frage hinzugefügt");
      setEditingQuestion(null);
      refetch();
    },
  });

  const deleteQuestionMutation = trpc.question.delete.useMutation({
    onSuccess: () => {
      toast.success("Frage gelöscht");
      refetch();
    },
  });

  const handleSaveCourse = () => {
    if (isNew) {
      createCourseMutation.mutate(courseData);
    } else {
      updateCourseMutation.mutate({ id: courseId, ...courseData });
    }
  };

  const handleAddTopic = () => {
    if (!newTopicTitle.trim() || isNew) return;
    createTopicMutation.mutate({
      courseId,
      title: newTopicTitle,
      orderIndex: (course?.topics?.length || 0) + 1,
    });
  };

  const toggleTopic = (topicId: number) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => setLocation('/admin/courses')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {isNew ? 'Neuer Kurs' : 'Kurs bearbeiten'}
                </h1>
                <p className="text-muted-foreground">
                  {isNew ? 'Erstellen Sie einen neuen Kurs' : course?.title}
                </p>
              </div>
            </div>
            <Button onClick={handleSaveCourse} disabled={createCourseMutation.isPending || updateCourseMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Speichern
            </Button>
          </div>
        </div>

        {/* Course Settings */}
        <div className="glass-card p-6">
          <h2 className="font-semibold mb-4">Kurseinstellungen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Kurstitel *</Label>
              <Input
                id="title"
                value={courseData.title}
                onChange={(e) => setCourseData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="z.B. Datenschutz Grundlagen"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseType">Kurstyp *</Label>
              <Select 
                value={courseData.courseType} 
                onValueChange={(v) => setCourseData(prev => ({ ...prev, courseType: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="learning">Learning (Optional)</SelectItem>
                  <SelectItem value="sensitization">Sensitization (3/5 richtig)</SelectItem>
                  <SelectItem value="certification">Certification (Jahresprüfung)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={courseData.description}
                onChange={(e) => setCourseData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Kurze Beschreibung des Kursinhalts..."
                rows={3}
              />
            </div>

            {courseData.courseType === 'certification' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="passingScore">Bestehensgrenze (%)</Label>
                  <Input
                    id="passingScore"
                    type="number"
                    min={1}
                    max={100}
                    value={courseData.passingScore}
                    onChange={(e) => setCourseData(prev => ({ ...prev, passingScore: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Zeitlimit (Minuten)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    min={1}
                    value={courseData.timeLimit}
                    onChange={(e) => setCourseData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Aktiv</p>
                <p className="text-sm text-muted-foreground">Kurs ist für Benutzer sichtbar</p>
              </div>
              <Switch
                checked={courseData.isActive}
                onCheckedChange={(checked) => setCourseData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Pflichtschulung</p>
                <p className="text-sm text-muted-foreground">Muss von allen absolviert werden</p>
              </div>
              <Switch
                checked={courseData.isMandatory}
                onCheckedChange={(checked) => setCourseData(prev => ({ ...prev, isMandatory: checked }))}
              />
            </div>
          </div>
        </div>

        {/* Topics Section - Only for existing courses */}
        {!isNew && (
          <div className="glass-card p-6">
            <h2 className="font-semibold mb-4">Themen & Fragen</h2>

            {/* Add Topic */}
            <div className="flex gap-2 mb-6">
              <Input
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                placeholder="Neues Thema hinzufügen..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
              />
              <Button onClick={handleAddTopic} disabled={!newTopicTitle.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Hinzufügen
              </Button>
            </div>

            {/* Topics List */}
            <div className="space-y-3">
              {course?.topics?.map((topic, idx) => (
                <TopicItem
                  key={topic.id}
                  topic={topic}
                  courseId={courseId}
                  index={idx}
                  expanded={expandedTopics.has(topic.id)}
                  onToggle={() => toggleTopic(topic.id)}
                  onDelete={() => deleteTopicMutation.mutate({ id: topic.id })}
                  onAddQuestion={() => setEditingQuestion({ topicId: topic.id })}
                  onDeleteQuestion={(qId) => deleteQuestionMutation.mutate({ id: qId })}
                />
              ))}
              
              {(!course?.topics || course.topics.length === 0) && (
                <p className="text-muted-foreground text-center py-8">
                  Noch keine Themen. Fügen Sie Ihr erstes Thema hinzu.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Question Editor Modal */}
        {editingQuestion && (
          <QuestionEditor
            topicId={editingQuestion.topicId}
            courseId={courseId}
            onSave={(data) => createQuestionMutation.mutate(data)}
            onCancel={() => setEditingQuestion(null)}
            isPending={createQuestionMutation.isPending}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function TopicItem({ 
  topic, 
  courseId,
  index, 
  expanded, 
  onToggle, 
  onDelete,
  onAddQuestion,
  onDeleteQuestion,
}: { 
  topic: any;
  courseId: number;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onAddQuestion: () => void;
  onDeleteQuestion: (id: number) => void;
}) {
  const { data: questions } = trpc.question.listByTopic.useQuery(
    { topicId: topic.id },
    { enabled: expanded }
  );

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div 
        className="p-4 flex items-center justify-between bg-muted/30 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="w-6 h-6 rounded bg-primary/10 text-primary text-sm flex items-center justify-center">
            {index + 1}
          </span>
          <span className="font-medium">{topic.title}</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>

      {expanded && (
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {questions?.length || 0} Fragen
            </span>
            <Button size="sm" variant="outline" onClick={onAddQuestion}>
              <Plus className="w-4 h-4 mr-2" />
              Frage hinzufügen
            </Button>
          </div>

          {questions?.map((q, qIdx) => (
            <div key={q.id} className="p-3 rounded-lg bg-muted/50 flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">
                  {qIdx + 1}. {q.questionText}
                </p>
                <p className="text-xs text-muted-foreground">
                  Richtig: {q.correctAnswer}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onDeleteQuestion(q.id)}
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionEditor({
  topicId,
  courseId,
  onSave,
  onCancel,
  isPending,
}: {
  topicId: number;
  courseId: number;
  onSave: (data: any) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [data, setData] = useState({
    topicId,
    courseId,
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A" as "A" | "B" | "C" | "D",
    explanation: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
        <h3 className="text-lg font-semibold mb-4">Neue Frage</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Frage *</Label>
            <Textarea
              value={data.questionText}
              onChange={(e) => setData(prev => ({ ...prev, questionText: e.target.value }))}
              placeholder="Geben Sie die Frage ein..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(['A', 'B', 'C', 'D'] as const).map(opt => (
              <div key={opt} className="space-y-2">
                <Label>Option {opt} *</Label>
                <Input
                  value={data[`option${opt}` as keyof typeof data] as string}
                  onChange={(e) => setData(prev => ({ ...prev, [`option${opt}`]: e.target.value }))}
                  placeholder={`Antwort ${opt}`}
                  required
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Richtige Antwort *</Label>
            <Select 
              value={data.correctAnswer} 
              onValueChange={(v) => setData(prev => ({ ...prev, correctAnswer: v as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="D">D</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Erklärung (optional)</Label>
            <Textarea
              value={data.explanation}
              onChange={(e) => setData(prev => ({ ...prev, explanation: e.target.value }))}
              placeholder="Erklärung zur richtigen Antwort..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
