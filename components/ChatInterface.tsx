'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Send, Bot, User, Database, Sparkles, Loader2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'

interface Message {
  role: 'user' | 'assistant'
  content: string
  usedKnowledgeBase?: boolean
  contextChunks?: number
}

export default function ChatInterface() {
  // Get state and actions from store
  const messages = useAppStore((state) => state.chatMessages)
  const setMessages = useAppStore((state) => state.setChatMessages)
  const addMessage = useAppStore((state) => state.addChatMessage)
  const inputValue = useAppStore((state) => state.chatInput)
  const setInputValue = useAppStore((state) => state.setChatInput)
  const clearChat = useAppStore((state) => state.clearChat)
  
  // Local UI state
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')

    // Add user message to chat
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
    }
    addMessage(newUserMessage)

    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          usedKnowledgeBase: data.usedKnowledgeBase,
          contextChunks: data.contextChunks,
        }
        addMessage(assistantMessage)
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request.',
        }
        addMessage(errorMessage)
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I could not connect to the AI service.',
      }
      addMessage(errorMessage)
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearChat = () => {
    clearChat()
  }

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">AI Chat Assistant</h3>
              <p className="text-sm text-muted-foreground">
                Ask questions and get answers powered by your knowledge base
              </p>
            </div>
            {messages.length > 0 && (
              <Button
                onClick={handleClearChat}
                variant="outline"
                size="sm"
                className="border-white/20"
              >
                Clear Chat
              </Button>
            )}
          </div>

          {/* Messages Container */}
          <div className="mb-4 flex min-h-[400px] max-h-[600px] flex-col overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-4">
            {messages.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-center">
                <div className="space-y-3">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white">
                      Start a Conversation
                    </h4>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Ask me anything! I can use your trained knowledge base to provide accurate answers.
                    </p>
                  </div>
                  <div className="mx-auto mt-4 max-w-md space-y-2 text-left text-xs text-muted-foreground">
                    <p className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Ask normal questions using my general knowledge</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Ask about your uploaded PDFs and documents</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Try: "What knowledge do you have?" or "Summarize what you know"</span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </p>
                      {message.role === 'assistant' && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          {message.usedKnowledgeBase ? (
                            <>
                              <Database className="h-3 w-3" />
                              <span>
                                Used knowledge base ({message.contextChunks} sources)
                              </span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3" />
                              <span>General knowledge</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div className="rounded-lg bg-white/10 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              className="flex-1 resize-none rounded-lg border-2 border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
              rows={2}
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="h-auto shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Help Text */}
          <p className="mt-2 text-xs text-muted-foreground">
            Tip: Ask about your uploaded documents or any general question. The AI will use your knowledge base when relevant.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
