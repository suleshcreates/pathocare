import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import {
  FileText, Download, QrCode, CheckCircle2, Calendar,
  Search, Share2, Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { bookingService } from '@/services/bookingService';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import type { Report } from '@/types';

export function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingParams, setLoadingParams] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReports = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const bookings = await bookingService.getPatientBookings(user.id);

        // Filter only ready reports
        const completedBookings = bookings.filter((b: any) =>
          b.status === 'REPORT_READY'
        );

        const mappedReports: Report[] = completedBookings.map((b: any) => ({
          id: b.id,
          bookingId: b.id,
          patientId: b.patientId,
          patientName: b.patientName || user.name,
          testId: b.testId,
          testName: b.testName,
          labId: b.labId,
          labName: b.labName,
          generatedAt: b.completedAt || b.bookedAt,
          verifiedBy: 'Lab Technician',
          parameters: [],
          summary: 'Report generated successfully.',
          pdfUrl: b.reportUrl && b.reportUrl !== '#' ? 'has-report' : '#',
          qrCode: 'mock-qr'
        }));

        setReports(mappedReports);
      } catch (error) {
        console.error("Failed to fetch reports", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [user?.id, user?.name]);

  useEffect(() => {
    if (containerRef.current && !loading) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.report-card'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, [searchQuery, loading]);

  // Fetch report values when a report is selected
  const handleViewReport = async (report: Report) => {
    setSelectedReport(report);
    setLoadingParams(true);
    try {
      const params = await bookingService.getReportValues(report.bookingId);
      setSelectedReport({ ...report, parameters: params });
    } catch (error) {
      console.error('Failed to load parameters:', error);
    } finally {
      setLoadingParams(false);
    }
  };

  // Download PDF handler
  const handleDownload = async (bookingId?: string) => {
    const id = bookingId || selectedReport?.bookingId;
    if (!id) return;

    try {
      const fetchedUrl = await bookingService.getReportUrl(id);
      if (fetchedUrl) {
        window.open(fetchedUrl, '_blank');
      } else {
        alert('Report PDF is not available yet. Please try again later.');
      }
    } catch (error) {
      console.error('Failed to get report URL:', error);
      alert('Failed to download report. Please try again.');
    }
  };

  // Share handler
  const handleShare = async () => {
    if (navigator.share && selectedReport) {
      try {
        await navigator.share({
          title: `${selectedReport.testName} - Test Report`,
          text: `View my ${selectedReport.testName} test report from ${selectedReport.labName}`,
          url: window.location.href
        });
      } catch (e) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  const filteredReports = reports.filter(report =>
    report.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.labName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div ref={containerRef} className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-800">My Reports</h1>
          <p className="text-slate-500 text-sm sm:text-base mt-0.5">View and download your test reports</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full lg:w-64"
            />
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        {filteredReports.map((report) => (
          <Card
            key={report.id}
            className="report-card overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            <CardContent className="p-0">
              {/* Header */}
              <div className="p-3 sm:p-5 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-9 h-9 sm:w-12 sm:h-12 bg-teal-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                      <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{report.testName}</h3>
                      <p className="text-sm text-slate-500">{report.labName}</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-3 sm:p-5">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div>
                    <p className="text-xs text-slate-500">Generated On</p>
                    <p className="text-sm font-medium text-slate-800 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(report.generatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Verified By</p>
                    <p className="text-sm font-medium text-slate-800">{report.verifiedBy}</p>
                  </div>
                </div>

                {/* Parameters Preview */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-2">Key Parameters</p>
                  <div className="space-y-2">
                    {report.parameters.slice(0, 3).map((param) => (
                      <div key={param.name} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{param.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'font-medium',
                            param.status === 'normal' ? 'text-emerald-600' :
                              param.status === 'high' ? 'text-amber-600' :
                                param.status === 'critical' ? 'text-rose-600' : 'text-slate-600'
                          )}>
                            {param.value} {param.unit}
                          </span>
                          <span className="text-xs text-slate-400">({param.referenceRange})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-4 p-3 bg-teal-50 rounded-lg border border-teal-100">
                  <p className="text-sm text-teal-800">
                    <span className="font-medium">Summary:</span> {report.summary}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleViewReport(report)}
                >
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedReport(report);
                    setShowQRDialog(true);
                  }}
                >
                  <QrCode className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1 bg-teal-500 hover:bg-teal-600"
                  onClick={() => handleDownload(report.bookingId)}
                >
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredReports.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700">No reports found</h3>
          <p className="text-slate-500 mt-2">Your test reports will appear here once ready</p>
        </div>
      )}

      {/* View Report Dialog */}
      <Dialog open={!!selectedReport && !showQRDialog} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Test Report Details</DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              {/* Report Header */}
              <div className="bg-gradient-to-br from-teal-500 to-indigo-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{selectedReport.testName}</h2>
                    <p className="text-teal-100">{selectedReport.labName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-teal-100">Report ID</p>
                    <p className="font-mono">{selectedReport.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
              </div>

              {/* Patient Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Patient</p>
                  <p className="font-medium text-slate-800">{selectedReport.patientName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Generated</p>
                  <p className="font-medium text-slate-800">
                    {new Date(selectedReport.generatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Verified By</p>
                  <p className="font-medium text-slate-800">{selectedReport.verifiedBy}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <Badge className="bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                </div>
              </div>

              {/* Parameters Table */}
              <div>
                <h3 className="font-semibold text-slate-800 mb-3">Test Parameters</h3>
                <div className="border rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Parameter</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Result</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Unit</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Reference Range</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {loadingParams ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                            Loading parameters...
                          </td>
                        </tr>
                      ) : selectedReport.parameters.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                            No parameters available
                          </td>
                        </tr>
                      ) : (
                        selectedReport.parameters.map((param) => (
                          <tr key={param.name} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm text-slate-800">{param.name}</td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-800">{param.value}</td>
                            <td className="px-4 py-3 text-sm text-slate-500">{param.unit}</td>
                            <td className="px-4 py-3 text-sm text-slate-500">{param.referenceRange}</td>
                            <td className="px-4 py-3">
                              <Badge className={cn(
                                'text-xs',
                                param.status === 'normal' && 'bg-emerald-100 text-emerald-700',
                                param.status === 'high' && 'bg-amber-100 text-amber-700',
                                param.status === 'low' && 'bg-sky-100 text-sky-700',
                                param.status === 'critical' && 'bg-rose-100 text-rose-700'
                              )}>
                                {param.status.charAt(0).toUpperCase() + param.status.slice(1)}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                <h3 className="font-semibold text-teal-800 mb-2">Doctor&apos;s Summary</h3>
                <p className="text-teal-700">{selectedReport.summary}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button className="flex-1 bg-teal-500 hover:bg-teal-600" onClick={() => handleDownload()}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Report Verification</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="w-48 h-48 bg-white border rounded-xl mx-auto mb-4 flex items-center justify-center overflow-hidden">
              {selectedReport ? (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    `${window.location.origin}/verify/${selectedReport.id}`
                  )}`}
                  alt="Report QR Code"
                  className="w-full h-full object-contain"
                />
              ) : (
                <QrCode className="w-32 h-32 text-slate-400" />
              )}
            </div>
            <p className="text-sm text-slate-500">
              Scan this QR code to verify the authenticity of this report
            </p>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              ID: {selectedReport?.id.slice(0, 8).toUpperCase() || '---'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
