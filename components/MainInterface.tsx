'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ChatInput from '@/components/ChatInput'
import ChatInterface from '@/components/ChatInterface'
import TrainingTab from '@/components/TrainingTab'
import { MessageSquare, BookOpen, MessagesSquare, Github, Coffee, Heart } from 'lucide-react'

export default function MainInterface() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-white">
          ✨ Smart AI Chat Input
        </h1>
        <p className="text-lg text-white/60">
          Train your AI with PDFs, get smart suggestions, and chat with your knowledge base
        </p>
        
        {/* Links Section */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <a
            href="https://github.com/DaraBoth/fine-tune-AI-suggestion"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/10"
          >
            <Github className="h-4 w-4 text-white/70 transition-colors group-hover:text-white" />
            <span className="text-sm text-white/70 transition-colors group-hover:text-white">
              Star on GitHub
            </span>
          </a>
          
          <a
            href="https://buymeacoffee.com/daraboth"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 backdrop-blur-xl transition-all hover:border-yellow-500/40 hover:bg-yellow-500/20"
          >
            <Coffee className="h-4 w-4 text-yellow-400 transition-colors group-hover:text-yellow-300" />
            <span className="text-sm text-yellow-400 transition-colors group-hover:text-yellow-300">
              Buy Me a Coffee
            </span>
          </a>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="autocomplete" className="w-full">
        <TabsList className="mb-8 grid w-full grid-cols-3 bg-white/10 p-1 backdrop-blur-xl">
          <TabsTrigger
            value="autocomplete"
            className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white"
          >
            <MessageSquare className="h-4 w-4" />
            Autocomplete
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white"
          >
            <MessagesSquare className="h-4 w-4" />
            AI Chat
          </TabsTrigger>
          <TabsTrigger
            value="training"
            className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white"
          >
            <BookOpen className="h-4 w-4" />
            Training
          </TabsTrigger>
        </TabsList>

        {/* Autocomplete Tab */}
        <TabsContent value="autocomplete" className="focus-visible:outline-none">
          <ChatInput />
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="focus-visible:outline-none">
          <ChatInterface />
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="focus-visible:outline-none">
          <TrainingTab />
        </TabsContent>
      </Tabs>
      
      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="flex items-center justify-center gap-1 text-sm text-white/40">
          Built with <Heart className="h-3 w-3 fill-red-500 text-red-500" /> by
          <a
            href="https://github.com/DaraBoth"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 transition-colors hover:text-white"
          >
            DaraBoth
          </a>
        </p>
        <p className="mt-2 text-xs text-white/30">
          TypeFlow AI v1.0.0 - Open Source
        </p>
      </div>
    </div>
  )
}
