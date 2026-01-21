import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Code, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DevelopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDevelop: (blueprint: Blueprint) => Promise<void>;
}

export interface Blueprint {
  projectName: string;
  stack: {
    frontend: string;
    backend: string;
    database: string;
  };
  features: string[];
}

interface ProgressLog {
  message: string;
  type: 'info' | 'success' | 'error';
  timestamp: Date;
}

export function DevelopModal({ isOpen, onClose, onDevelop }: DevelopModalProps) {
  const [step, setStep] = useState<'blueprint' | 'progress' | 'complete'>('blueprint');
  const [projectName, setProjectName] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'Authentication',
    'Database Integration',
    'API Endpoints',
  ]);
  const [logs, setLogs] = useState<ProgressLog[]>([]);

  const availableFeatures = [
    'Authentication',
    'Database Integration',
    'API Endpoints',
    'Real-time Updates',
    'File Upload',
    'Email Notifications',
    'Payment Integration',
    'Analytics Dashboard',
  ];

  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  const handleStartDevelopment = async () => {
    setStep('progress');
    setLogs([]);

    const blueprint: Blueprint = {
      projectName,
      stack: {
        frontend: 'Next.js + Tailwind CSS',
        backend: 'Supabase',
        database: 'PostgreSQL',
      },
      features: selectedFeatures,
    };

    const simulateProgress = async () => {
      const steps = [
        { message: 'Initializing project structure...', type: 'info' as const },
        { message: 'Generating database schema...', type: 'info' as const },
        { message: 'Creating API endpoints...', type: 'info' as const },
        { message: 'Building frontend components...', type: 'info' as const },
        { message: 'Configuring authentication...', type: 'info' as const },
        { message: 'Setting up real-time features...', type: 'info' as const },
        { message: 'Running tests...', type: 'info' as const },
        { message: 'Deploying application...', type: 'info' as const },
      ];

      for (const step of steps) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setLogs((prev) => [...prev, { ...step, timestamp: new Date() }]);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      setLogs((prev) => [
        ...prev,
        {
          message: 'Project successfully deployed!',
          type: 'success',
          timestamp: new Date(),
        },
      ]);

      setStep('complete');
    };

    try {
      await Promise.all([onDevelop(blueprint), simulateProgress()]);
    } catch (error) {
      setLogs((prev) => [
        ...prev,
        {
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error',
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleClose = () => {
    setStep('blueprint');
    setProjectName('');
    setLogs([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      {/* max-h-[90dvh] per assicurarsi che il modal non superi mai l'altezza dello schermo mobile */}
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90dvh] overflow-hidden flex flex-col p-0">
        <div className="p-6 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <Code className="h-5 w-5 text-green-400" />
              </div>
              {step === 'blueprint' && 'Project Blueprint'}
              {step === 'progress' && 'Building Your Project'}
              {step === 'complete' && 'Project Ready!'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {step === 'blueprint' && 'Configure your project stack and features'}
              {step === 'progress' && 'Your application is being generated...'}
              {step === 'complete' && 'Your project has been successfully created'}
            </DialogDescription>
          </DialogHeader>

          {step === 'blueprint' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName" className="text-gray-300">Project Name</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="my-awesome-app"
                  className="bg-gray-800/50 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Stack</Label>
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-gray-400">Frontend:</span><span className="text-white font-medium">Next.js + Tailwind CSS</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Backend:</span><span className="text-white font-medium">Supabase</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Database:</span><span className="text-white font-medium">PostgreSQL</span></div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Features</Label>
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3">
                  {availableFeatures.map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature}
                        checked={selectedFeatures.includes(feature)}
                        onCheckedChange={() => handleFeatureToggle(feature)}
                        className="border-gray-600"
                      />
                      <label htmlFor={feature} className="text-sm text-gray-300 cursor-pointer">{feature}</label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleStartDevelopment}
                disabled={!projectName.trim() || selectedFeatures.length === 0}
                className="w-full bg-green-600 hover:bg-green-500 text-white h-12"
              >
                Start Development
              </Button>
            </div>
          )}

          {step === 'progress' && (
            <div className="space-y-4">
              <ScrollArea className="h-[300px] bg-gray-950 rounded-lg border border-gray-800 p-4">
                <div className="space-y-2 font-mono text-sm">
                  {logs.map((log, index) => (
                    <div key={index} className="flex items-start gap-2">
                      {log.type === 'info' && <Loader2 className="h-4 w-4 text-blue-400 animate-spin mt-0.5" />}
                      {log.type === 'success' && <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5" />}
                      <span className={log.type === 'success' ? 'text-green-400' : 'text-gray-300'}>{log.message}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-full bg-green-500/10 border border-green-500/20 inline-block">
                <CheckCircle2 className="h-12 w-12 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">All Set!</h3>
              <p className="text-sm text-gray-400">Your project has been successfully created.</p>
              <Button onClick={handleClose} className="w-full bg-green-600 h-12">Close</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
