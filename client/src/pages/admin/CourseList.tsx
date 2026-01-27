import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { BookOpen, Plus, ArrowLeft, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export default function CourseList() {
  const [, setLocation] = useLocation();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: courses, isLoading, refetch } = trpc.course.listAll.useQuery();
  
  const deleteMutation = trpc.course.delete.useMutation({
    onSuccess: () => {
      toast.success("Kurs gelöscht");
      refetch();
      setDeleteId(null);
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => setLocation('/admin')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Kurse</h1>
              <p className="text-muted-foreground">
                {courses?.length || 0} Kurse verfügbar
              </p>
            </div>
            <Button onClick={() => setLocation('/admin/courses/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Neuer Kurs
            </Button>
          </div>
        </div>

        {/* Course List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="h-6 w-20 bg-muted rounded mb-4" />
                <div className="h-6 w-3/4 bg-muted rounded mb-2" />
                <div className="h-4 w-full bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : courses && courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <div key={course.id} className="course-card relative group">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(course.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
                
                <div 
                  className="cursor-pointer"
                  onClick={() => setLocation(`/admin/courses/${course.id}`)}
                >
                  <span className={`badge-${course.courseType} mb-3 inline-block`}>
                    {course.courseType === 'learning' ? 'Learning' : 
                     course.courseType === 'sensitization' ? 'Sensitization' : 'Certification'}
                  </span>
                  <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {course.description || 'Keine Beschreibung'}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`px-2 py-1 rounded ${
                      course.isActive 
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {course.isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                    {course.isMandatory && (
                      <span className="text-amber-400">Pflicht</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Kurse</h3>
            <p className="text-muted-foreground mb-6">
              Erstellen Sie Ihren ersten Kurs.
            </p>
            <Button onClick={() => setLocation('/admin/courses/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Neuer Kurs
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kurs löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Themen, 
              Fragen und Fortschrittsdaten werden ebenfalls gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
