
const SUPABASE_URL = 'https://fflawatbcocazbsblzkl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmbGF3YXRiY29jYXpic2JsemtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1OTQzMDcsImV4cCI6MjA3MDE3MDMwN30.4bCY4AcHHsWsXJCvcVhoVXABdn7UV3S7pxIuX4jMoww'

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const app = {
    currentUser: null,

    init: async function() {
        const authContainer = document.getElementById('auth-container')
        const chatApp = document.getElementById('chat-app')

        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
            authContainer.style.display = 'none'
            chatApp.style.display = 'block'
            this.currentUser = session.user
            this.setupChat()
        }
    },

    signUp: async function() {
        const email = document.getElementById('email').value
        const password = document.getElementById('password').value
        
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        })

        if (error) {
            alert('Sign Up Error: ' + error.message)
        } else {
            alert('Check your email for verification link!')
        }
    },

    signIn: async function() {
        const email = document.getElementById('email').value
        const password = document.getElementById('password').value
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        })

        if (error) {
            alert('Sign In Error: ' + error.message)
        } else {
            document.getElementById('auth-container').style.display = 'none'
            document.getElementById('chat-app').style.display = 'block'
            this.currentUser = data.user
            this.setupChat()
        }
    },

    signOut: async function() {
        await supabase.auth.signOut()
        document.getElementById('auth-container').style.display = 'block'
        document.getElementById('chat-app').style.display = 'none'
    },

    setupChat: function() {
        const chatContainer = document.getElementById('chat-container')
        chatContainer.innerHTML = '' // Clear previous messages

        // Subscribe to new messages
        supabase
            .channel('messages')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages' 
            }, (payload) => {
                this.renderMessage(payload.new)
            })
            .subscribe()

        // Load initial messages
        this.loadMessages()
    },

    loadMessages: async function() {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true })

        if (data) {
            data.forEach(message => this.renderMessage(message))
        }
    },

    sendMessage: async function() {
        const messageInput = document.getElementById('message-input')
        const message = messageInput.value.trim()
        
        if (message) {
            const { data, error } = await supabase
                .from('messages')
                .insert([
                    { 
                        content: message, 
                        user_id: this.currentUser.id 
                    }
                ])

            if (error) {
                console.error('Error sending message:', error)
            } else {
                messageInput.value = ''
            }
        }
    },

    renderMessage: function(message) {
        const chatContainer = document.getElementById('chat-container')
        const messageElement = document.createElement('div')
        
        messageElement.classList.add('message')
        
        // Determine if message is sent or received
        if (message.user_id === this.currentUser.id) {
            messageElement.classList.add('sent-message')
        } else {
            messageElement.classList.add('received-message')
        }
        
        messageElement.textContent = message.content
        chatContainer.appendChild(messageElement)
        chatContainer.scrollTop = chatContainer.scrollHeight
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => app.init())
