const questions = [
    {
        question: "実際の新築住宅で、不備や欠陥が見つかる平均数は？",
        image: "images/1.png",
        answers: ["1〜3カ所", "4〜9カ所", "10〜17カ所", "18カ所以上"],
        correctAnswer: 3 // D. 18カ所以上
    },
    {
        question: "この写真の中に耐震性能に関わる欠陥があります。どれが不具合か回答してください",
        image: "images/2.png",
        answers: ["木材の種類が間違っている", "ビスが完全に締まっていない", "ビスが規定通より少ない"],
        correctAnswer: 1 // B. ビスが完全に締まっていない
    },
    {
        question: "この写真の中に断熱性能に関する欠陥があります。どれが不具合か回答してください",
        image: "images/3.png",
        answers: ["断熱材が不足し空洞になっている", "断熱材の厚さが不足している", "断熱材の種類が間違っている"],
        correctAnswer: 0 // A. 断熱材が不足し空洞になっている
    },
    {
        question: "この写真の中に防水性能に関する欠陥があります。いくつ不具合がありますか？",
        image: "images/4.png",
        answers: ["1", "2", "3"],
        correctAnswer: 1 // B. 2
    },
    {
        question: "この写真の中に基礎工事に関する欠陥があります。いくつ不具合がありますか？",
        image: "images/5.png",
        answers: ["使用している鉄筋が規定より細い", "配筋を設置する間隔が広すぎる", "使用する鉄筋の種類が間違っている"],
        correctAnswer: 1 // B. 配筋を設置する間隔が広すぎる
    },
    {
        question: "新築で施工ミスが起こる一番の原因は、次のうちどれ？",
        image: "images/6.png",
        answers: ["現場の職人のスキル不足", "施工内容の確認・管理不足", "材料の品質や不良品の混入", "天候などの自然条件"],
        correctAnswer: 1 // B. 施工内容の確認・管理不足
    }
];

let currentQuestion = 0;
let score = 0;
let answered = false;

function startQuiz() {
    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('quiz-screen').classList.add('active');
    currentQuestion = 0;
    score = 0;
    showQuestion();
}

function showQuestion() {
    answered = false;
    const question = questions[currentQuestion];
    
    document.getElementById('question-number').textContent = `${currentQuestion + 1}問目 / ${questions.length}問中`;
    document.getElementById('question-text').textContent = question.question;
    
    const questionImage = document.getElementById('question-image');
    if (question.image && questionImage) {
        questionImage.src = question.image;
        questionImage.style.display = 'block';
    } else if (questionImage) {
        questionImage.style.display = 'none';
    }
    
    updateProgressDots();
    
    // 回答ボタンを動的に生成
    const answerButtonsContainer = document.getElementById('answer-buttons');
    answerButtonsContainer.innerHTML = '';
    
    question.answers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.className = 'answer-btn';
        button.textContent = answer;
        button.onclick = () => selectAnswer(index);
        answerButtonsContainer.appendChild(button);
    });
    
    document.getElementById('feedback').classList.remove('show', 'correct', 'incorrect');
    document.getElementById('next-btn').style.display = 'none';
}

function updateProgressDots() {
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        dot.classList.remove('active', 'completed');
        if (index < currentQuestion) {
            dot.classList.add('completed');
        } else if (index === currentQuestion) {
            dot.classList.add('active');
        }
    });
}

function selectAnswer(answerIndex) {
    if (answered) return;
    
    answered = true;
    const question = questions[currentQuestion];
    const answerButtons = document.querySelectorAll('.answer-btn');
    const feedbackElement = document.getElementById('feedback');
    
    answerButtons.forEach(button => button.disabled = true);
    
    if (answerIndex === question.correctAnswer) {
        score++;
        answerButtons[answerIndex].classList.add('correct');
        feedbackElement.textContent = '正解です！';
        feedbackElement.classList.add('show', 'correct');
    } else {
        answerButtons[answerIndex].classList.add('incorrect');
        answerButtons[question.correctAnswer].classList.add('correct');
        feedbackElement.textContent = '不正解です。正解は「' + question.answers[question.correctAnswer] + '」でした。';
        feedbackElement.classList.add('show', 'incorrect');
    }
    
    if (currentQuestion === questions.length - 1) {
        document.getElementById('next-btn').textContent = '結果を見る';
    }
    document.getElementById('next-btn').style.display = 'block';
}

function nextQuestion() {
    currentQuestion++;
    
    if (currentQuestion >= questions.length) {
        showResult();
    } else {
        showQuestion();
    }
}

function showResult() {
    document.getElementById('quiz-screen').classList.remove('active');
    document.getElementById('result-screen').classList.add('active');
    
    const percentage = Math.round((score / questions.length) * 100);
    
    document.getElementById('score-text').textContent = `${questions.length}問中${score}問正解`;
    document.getElementById('percentage').textContent = `正解率: ${percentage}%`;
    
    let message = '';
    if (percentage === 100) {
        message = 'パーフェクト！素晴らしい結果です！あなたの直感力と判断力は抜群です。';
    } else if (percentage >= 80) {
        message = '素晴らしい！とても良い結果です。あなたは優れた洞察力を持っています。';
    } else if (percentage >= 60) {
        message = '良い結果です！あなたはバランスの取れた判断力を持っています。';
    } else if (percentage >= 40) {
        message = 'まずまずの結果です。もう少し自分の直感を信じてみましょう。';
    } else {
        message = '次回はもっと良い結果が出るはずです。自分らしい選択を心がけてみてください。';
    }
    
    document.getElementById('result-message-text').textContent = message;
}

function restartQuiz() {
    document.getElementById('result-screen').classList.remove('active');
    document.getElementById('start-screen').classList.add('active');
}

window.onload = function() {
    const startScreen = document.getElementById('start-screen');
    const h1 = startScreen.querySelector('h1');
    h1.textContent = '住宅施工の知識診断クイズ';
    
    const newH2 = document.createElement('h2');
    newH2.textContent = '新築住宅の施工に関する知識をテストします';
    h1.after(newH2);
    
    const btn = startScreen.querySelector('.btn-primary');
    btn.textContent = '診断を始める';
};