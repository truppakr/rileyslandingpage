import { db } from './firebase-config.js';
import { authManager } from './auth.js';
import { 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    updateDoc, 
    doc, 
    arrayUnion, 
    arrayRemove,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export class CommentsManager {
    constructor() {
        this.commentsRef = collection(db, 'comments');
        this.unsubscribe = null;
        this.init();
    }

    init() {
        this.setupCommentsSection();
        this.loadComments();
        this.setupEventListeners();
    }

    setupCommentsSection() {
        const main = document.querySelector('main');
        if (!main) return;

        const commentsSection = document.createElement('section');
        commentsSection.className = 'comments-section';
        commentsSection.innerHTML = `
            <h2>Community Comments</h2>
            <div class="protected comment-form-container">
                <form id="comment-form" class="comment-form">
                    <textarea id="comment-text" placeholder="Share your thoughts..." required></textarea>
                    <button type="submit" class="submit-comment-btn">
                        <span class="link-text">Post Comment</span>
                    </button>
                </form>
            </div>
            <div id="comments-list" class="comments-list"></div>
        `;
        
        main.appendChild(commentsSection);
    }

    setupEventListeners() {
        const commentForm = document.getElementById('comment-form');
        if (commentForm) {
            commentForm.addEventListener('submit', (e) => this.handleSubmitComment(e));
        }
    }

    async handleSubmitComment(e) {
        e.preventDefault();
        
        if (!authManager.isAuthenticated()) {
            alert('Please sign in to post comments');
            return;
        }

        const textArea = document.getElementById('comment-text');
        const text = textArea.value.trim();
        
        if (!text) return;

        const submitBtn = document.querySelector('.submit-comment-btn');
        const submitSpan = submitBtn.querySelector('.link-text');
        
        submitSpan.textContent = 'Posting...';
        submitBtn.disabled = true;

        try {
            await addDoc(this.commentsRef, {
                text: text,
                userId: authManager.currentUser.uid,
                userName: authManager.currentUser.displayName || authManager.currentUser.email,
                userEmail: authManager.currentUser.email,
                timestamp: serverTimestamp(),
                likes: [],
                likeCount: 0
            });

            textArea.value = '';
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('Error posting comment. Please try again.');
        } finally {
            submitSpan.textContent = 'Post Comment';
            submitBtn.disabled = false;
        }
    }

    loadComments() {
        const q = query(this.commentsRef, orderBy('timestamp', 'desc'));
        
        this.unsubscribe = onSnapshot(q, (snapshot) => {
            const commentsList = document.getElementById('comments-list');
            if (!commentsList) return;

            commentsList.innerHTML = '';

            snapshot.forEach((doc) => {
                const comment = { id: doc.id, ...doc.data() };
                this.renderComment(comment, commentsList);
            });
        });
    }

    renderComment(comment, container) {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment';
        commentDiv.dataset.commentId = comment.id;

        const isLiked = authManager.isAuthenticated() && 
                       comment.likes && 
                       comment.likes.includes(authManager.currentUser.uid);

        const timeString = comment.timestamp ? 
                          new Date(comment.timestamp.toDate()).toLocaleDateString() : 
                          'Just now';

        commentDiv.innerHTML = `
            <div class="comment-header">
                <span class="comment-author">${comment.userName}</span>
                <span class="comment-time">${timeString}</span>
            </div>
            <div class="comment-text">${comment.text}</div>
            <div class="comment-actions">
                <button class="like-btn ${isLiked ? 'liked' : ''}" data-comment-id="${comment.id}">
                    <span class="like-icon">${isLiked ? '❤️' : '🤍'}</span>
                    <span class="like-count">${comment.likeCount || 0}</span>
                </button>
            </div>
        `;

        const likeBtn = commentDiv.querySelector('.like-btn');
        likeBtn.addEventListener('click', () => this.handleLikeComment(comment.id));

        container.appendChild(commentDiv);
    }

    async handleLikeComment(commentId) {
        if (!authManager.isAuthenticated()) {
            alert('Please sign in to like comments');
            return;
        }

        const commentRef = doc(db, 'comments', commentId);
        const userId = authManager.currentUser.uid;
        
        const commentDiv = document.querySelector(`[data-comment-id="${commentId}"]`);
        const likeBtn = commentDiv.querySelector('.like-btn');
        const isLiked = likeBtn.classList.contains('liked');

        try {
            if (isLiked) {
                await updateDoc(commentRef, {
                    likes: arrayRemove(userId),
                    likeCount: Math.max(0, (await this.getCommentLikeCount(commentId)) - 1)
                });
            } else {
                await updateDoc(commentRef, {
                    likes: arrayUnion(userId),
                    likeCount: (await this.getCommentLikeCount(commentId)) + 1
                });
            }
        } catch (error) {
            console.error('Error liking comment:', error);
        }
    }

    async getCommentLikeCount(commentId) {
        try {
            const commentRef = doc(db, 'comments', commentId);
            const commentSnap = await getDoc(commentRef);
            return commentSnap.exists() ? (commentSnap.data().likeCount || 0) : 0;
        } catch (error) {
            return 0;
        }
    }

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}

export const commentsManager = new CommentsManager();