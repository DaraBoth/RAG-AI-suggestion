'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowRight, Play, FileText, Sparkles, Zap, Download, ArrowLeft, BookOpen } from 'lucide-react'
import { BorderBeam } from '@/components/ui/border-beam'
import { DotPattern } from '@/components/ui/dot-pattern'
import ShimmerButton from '@/components/ui/shimmer-button'

export default function IntroPage() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  return (
    <div className="min-h-screen bg-[#030303]">
      <DotPattern
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
        className="fixed inset-0 opacity-10 [mask-image:radial-gradient(white,transparent_70%)]"
      />

      <div className="container mx-auto max-w-7xl px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" className="text-white/60 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to App
            </Button>
          </Link>
          
          <Link href="/docs">
            <Button variant="ghost" className="text-white/60 hover:text-white">
              <BookOpen className="mr-2 h-4 w-4" />
              API Documentation
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">Intelligent Autocomplete with RAG</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Welcome to <span className="text-gradient">TypeFlow AI</span>
          </h1>
          
          <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8">
            Experience the future of text input with AI-powered autocomplete, RAG-based chat, 
            and intelligent training systems. Built with Next.js 16 and cutting-edge technology.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/#autocomplete">
              <ShimmerButton className="px-6 py-3">
                <Zap className="mr-2 h-5 w-5" />
                Try Demo
              </ShimmerButton>
            </Link>
            
            <Link href="/docs">
              <Button 
                variant="outline" 
                className="px-6 py-3 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                View Documentation
              </Button>
            </Link>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="video" className="w-full">
          <TabsList className="grid grid-cols-2 gap-4 p-2 bg-white/5 backdrop-blur-xl border border-white/10 mb-8 h-auto">
            <TabsTrigger 
              value="video"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 hover:text-white/80 transition-colors flex items-center justify-center gap-2 py-3 px-4"
            >
              <Play className="h-5 w-5" />
              <span className="text-base font-medium">Video Presentation</span>
            </TabsTrigger>
            <TabsTrigger 
              value="slides"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 hover:text-white/80 transition-colors flex items-center justify-center gap-2 py-3 px-4"
            >
              <FileText className="h-5 w-5" />
              <span className="text-base font-medium">Architecture Slides</span>
            </TabsTrigger>
          </TabsList>

          {/* Video Tab */}
          <TabsContent value="video">
            <Card className="border-white/10 bg-black/40 backdrop-blur-xl relative overflow-hidden">
              <BorderBeam size={300} duration={15} delay={0} />
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Play className="h-5 w-5 text-purple-400" />
                  TypeFlow AI Presentation
                </CardTitle>
                <CardDescription>
                  Watch a comprehensive overview of TypeFlow AI features and architecture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-black/60 rounded-lg overflow-hidden border border-white/10 group">
                  {!isVideoPlaying ? (
                    <div 
                      className="absolute inset-0 flex items-center justify-center cursor-pointer"
                      onClick={() => setIsVideoPlaying(true)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="h-10 w-10 text-white ml-1" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <video 
                      controls 
                      autoPlay
                      className="w-full h-full"
                      onEnded={() => setIsVideoPlaying(false)}
                    >
                      <source src="/asset/video/TypeFlowAI presentation.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                  
                  {!isVideoPlaying && (
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg p-4">
                        <h3 className="text-white font-semibold mb-1">TypeFlow AI Overview</h3>
                        <p className="text-sm text-white/60">Learn about features, architecture, and implementation</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-center">
                  <a 
                    href="/asset/video/TypeFlowAI presentation.mp4" 
                    download
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Video
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Slides Tab */}
          <TabsContent value="slides">
            <Card className="border-white/10 bg-black/40 backdrop-blur-xl relative overflow-hidden">
              <BorderBeam size={300} duration={15} delay={2} />
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-400" />
                  Architecture Documentation
                </CardTitle>
                <CardDescription>
                  Detailed slides explaining the TypeFlow AI architecture and RAG implementation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-[4/3] bg-black/60 rounded-lg overflow-hidden border border-white/10">
                  <iframe
                    src="/asset/slide/TypeFlow_AI_Intelligent_Autocomplete_Architecture.pdf"
                    className="w-full h-full"
                    title="TypeFlow AI Architecture Slides"
                  />
                </div>

                <div className="mt-6 flex items-center justify-center gap-6">
                  <a 
                    href="/asset/slide/TypeFlow_AI_Intelligent_Autocomplete_Architecture.pdf" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    Open in New Tab
                  </a>
                  <a 
                    href="/asset/slide/TypeFlow_AI_Intelligent_Autocomplete_Architecture.pdf" 
                    download
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Features Grid */}
        <div className="mt-16 mb-12">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Choose TypeFlow AI?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-white/10 bg-black/40 backdrop-blur-xl hover:border-white/20 transition-all group">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-6 w-6 text-blue-400" />
                </div>
                <CardTitle className="text-white">Smart Autocomplete</CardTitle>
                <CardDescription>
                  RAG-powered word completion and phrase suggestions with 90%+ accuracy
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-white/10 bg-black/40 backdrop-blur-xl hover:border-white/20 transition-all group">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6 text-purple-400" />
                </div>
                <CardTitle className="text-white">Lightning Fast</CardTitle>
                <CardDescription>
                  Sub-300ms response times with intelligent caching and vector search
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-white/10 bg-black/40 backdrop-blur-xl hover:border-white/20 transition-all group">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6 text-green-400" />
                </div>
                <CardTitle className="text-white">Train on Your Data</CardTitle>
                <CardDescription>
                  Upload PDFs and documents to customize AI responses to your domain
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-16 border-t border-white/5">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-white/60 mb-8 max-w-2xl mx-auto">
            Try TypeFlow AI now and experience the future of intelligent text input
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/">
              <ShimmerButton className="px-8 py-4 text-base">
                Launch Application
                <ArrowRight className="ml-2 h-5 w-5" />
              </ShimmerButton>
            </Link>
            
            <Link href="/docs">
              <Button 
                variant="outline"
                className="px-8 py-4 text-base border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
              >
                Read Documentation
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center border-t border-white/5 pt-8">
          <p className="text-white/40 text-sm">
            Built with ❤️ by KOSIGN Global Biz Center
          </p>
          <p className="text-white/30 text-xs mt-2">
            TypeFlow AI v1.0.0 • Powered by Next.js 16 & React 19
          </p>
        </div>
      </div>
    </div>
  )
}
