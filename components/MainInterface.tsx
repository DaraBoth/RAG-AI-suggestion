'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ChatInput from '@/components/ChatInput'
import ChatInterface from '@/components/ChatInterface'
import TrainingTab from '@/components/TrainingTab'
import { MessageSquare, BookOpen, MessagesSquare } from 'lucide-react'

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
    </div>
  )
}
