import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { 
  Upload, FileText, CheckCircle2, X, QrCode, 
  Search, Download, Eye, Clock 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { bookings } from '@/data/mockData';
import { cn } from '@/lib/utils';

export function UploadReport() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<typeof bookings[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.animate-item'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, []);

  const readyBookings = bookings.filter(b => 
    b.status === 'testing' || b.status === 'sample-collected'
  );

  const filteredBookings = readyBookings.filter(booking =>
    booking.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.testName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    setShowPreview(true);
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Upload Reports</h1>
        <p className="text-slate-500 mt-1">Upload and manage patient test reports</p>
      </div>

      {/* Upload Section */}
      <Card className="animate-item">
        <CardHeader>
          <CardTitle>Upload New Report</CardTitle>
        </CardHeader>
        <CardContent>
          {!uploadedFile ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={cn(
                'border-2 border-dashed rounded-2xl p-12 text-center transition-all',
                dragActive 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-slate-300 hover:border-indigo-300 hover:bg-slate-50'
              )}
            >
              <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-10 h-10 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Drop PDF file here</h3>
              <p className="text-slate-500 mt-2">or click to browse from your computer</p>
              <p className="text-sm text-slate-400 mt-1">Maximum file size: 10MB</p>
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Browse Files
              </Button>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-7 h-7 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">{uploadedFile.name}</h4>
                    <p className="text-sm text-slate-500">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setUploadedFile(null)}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Select Patient */}
              <div className="mt-6">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Select Patient Booking
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search patient or test..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {filteredBookings.map((booking) => (
                    <button
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className={cn(
                        'w-full p-3 text-left rounded-xl border transition-all',
                        selectedBooking?.id === booking.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-800">{booking.patientName}</p>
                          <p className="text-sm text-slate-500">{booking.testName}</p>
                        </div>
                        <Badge variant="outline">{booking.id}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full mt-4 bg-indigo-500 hover:bg-indigo-600"
                disabled={!selectedBooking}
                onClick={handleUpload}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Uploads */}
      <div className="animate-item">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Recently Uploaded</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.filter(b => b.reportUrl).map((booking) => (
            <Card key={booking.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-emerald-600" />
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Ready
                  </Badge>
                </div>
                
                <h4 className="font-medium text-slate-800">{booking.testName}</h4>
                <p className="text-sm text-slate-500">{booking.patientName}</p>
                
                <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  {booking.completedAt ? new Date(booking.completedAt).toLocaleDateString() : 'N/A'}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button size="sm" className="flex-1 bg-indigo-500 hover:bg-indigo-600">
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setShowQRDialog(true)}
                  >
                    <QrCode className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Preview</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Report Header */}
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{selectedBooking?.testName}</h2>
                  <p className="text-indigo-100">{selectedBooking?.labName}</p>
                </div>
                <Badge className="bg-white/20 text-white">Preview</Badge>
              </div>
            </div>

            {/* Patient Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500">Patient</p>
                <p className="font-medium text-slate-800">{selectedBooking?.patientName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Booking ID</p>
                <p className="font-medium text-slate-800">{selectedBooking?.id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Date</p>
                <p className="font-medium text-slate-800">{selectedBooking?.appointmentDate}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">File</p>
                <p className="font-medium text-slate-800">{uploadedFile?.name}</p>
              </div>
            </div>

            {/* PDF Preview Placeholder */}
            <div className="bg-slate-100 rounded-xl p-8 text-center">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">PDF Preview</p>
              <p className="text-sm text-slate-400">{uploadedFile?.name}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button className="flex-1 bg-indigo-500 hover:bg-indigo-600">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm & Upload
              </Button>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Report Verification QR</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="w-48 h-48 bg-slate-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <QrCode className="w-32 h-32 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">
              Scan to verify report authenticity
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
