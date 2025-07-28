let currentStep = 1;
const totalSteps = 6;

// 診断結果の計算データ
const basePrice = 2500; // 基準価格（万円）
const scoringData = {
    // 階数
    'q1': {
        '平屋': 100,
        '2階建': 0,
        '3階建': 100
    },
    // LDKサイズ
    'ldk-size': {
        '18畳以下': 0,
        '18-23畳': 150,
        '23畳以上': 200
    },
    // LDKの形
    'ldk-shape': {
        '縦型': 0,
        'L型': 0,
        '正方形型': 0
    },
    // 子ども部屋
    'children-room': {
        'いらない': 0,
        '1部屋': 0,
        '2部屋': 50,
        '3部屋': 100
    },
    // 和室
    'japanese-room': {
        '不要': 0,
        'LDK一体型': 100,
        '独立型': 200
    },
    // キッチンスタイル
    'kitchen-style': {
        'I型': 0,
        'アイランド': 50,
        'L型': 50,
        '二の字型': 100
    },
    // キッチン配置
    'kitchen-layout': {
        '縦並び': 0,
        '横並び': 0
    },
    // 寝室収納
    'bedroom-storage': {
        'クローゼット': 30,
        'ウォークイン': 50,
        '不要': 0
    },
    // 衣服収納
    'clothing-storage': {
        '個別収納': 0,
        'ファミクロ': 0,
        '両方': 50
    },
    // 玄関
    'entrance': {
        'シンプル': 0,
        'ウォークスルー': 80,
        '土間収納': 40
    },
    // 階段
    'stairs': {
        'リビング階段': 0,
        'ホール階段': 0,
        '平屋': 0
    },
    // バルコニー
    'balcony': {
        '必要': 100,
        '不必要': 0
    },
    // 吹き抜け
    'atrium': {
        'なし': 0,
        'あり': 50
    },
    // 洗面所
    'washroom': {
        '分離': 70,
        '一体型': 0
    }
};

// 予算範囲とURL のマッピング
const budgetRanges = [
    { min: 2250, max: 2550, url: 'https://s.lmes.jp/landing-qr/2000367119-QDy2qgMo?uLand=wgR0CX' },
    { min: 2400, max: 2600, url: 'https://s.lmes.jp/landing-qr/2000367119-QDy2qgMo?uLand=i59k3V' },
    { min: 2550, max: 2750, url: 'https://s.lmes.jp/landing-qr/2000367119-QDy2qgMo?uLand=7zjNh6' },
    { min: 2700, max: 2900, url: 'https://s.lmes.jp/landing-qr/2000367119-QDy2qgMo?uLand=79fu6S' },
    { min: 2850, max: 3050, url: 'https://s.lmes.jp/landing-qr/2000367119-QDy2qgMo?uLand=GLoE0B' },
    { min: 3000, max: 3300, url: 'https://s.lmes.jp/landing-qr/2000367119-QDy2qgMo?uLand=dEvKEG' },
    { min: 3150, max: 3450, url: 'https://s.lmes.jp/landing-qr/2000367119-QDy2qgMo?uLand=jSDfRx' },
    { min: 3300, max: 3600, url: 'https://s.lmes.jp/landing-qr/2000367119-QDy2qgMo?uLand=Q1LAoe' },
    { min: 3450, max: 3750, url: 'https://s.lmes.jp/landing-qr/2000367119-QDy2qgMo?uLand=NoaUSp' },
    { min: 3600, max: 3900, url: 'https://s.lmes.jp/landing-qr/2000367119-QDy2qgMo?uLand=hGrBKZ' }
];

// 回答データを保存するオブジェクト
let surveyAnswers = {};

function showStep(stepNumber) {
    // すべてのステップを非表示
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    // 指定されたステップを表示
    document.getElementById(`step${stepNumber}`).classList.add('active');
    
    // ブラウザ履歴を更新
    history.pushState({step: stepNumber}, '', `#step${stepNumber}`);
    
    // スクロール位置を上部に
    window.scrollTo(0, 0);
}

function nextStep() {
    // フォームの検証（必要に応じて）
    if (validateCurrentStep()) {
        if (currentStep < 5) {
            currentStep++;
            showStep(currentStep);
        } else if (currentStep === 5) {
            // ステップ5のアンケート回答をチェックして分岐
            const selectedStatus = Array.from(document.querySelectorAll('input[name="current-status"]:checked'))
                .map(input => input.value);
            
            const hasAdvancedStatus = selectedStatus.some(status => 
                status === '住宅会社と契約し打ち合わせ中' || 
                status === '着工済み' ||
                status === '完成or引っ越し済み'
            );
            
            // 診断結果を計算
            calculateResult();
            
            if (hasAdvancedStatus) {
                // 契約済み・完成済みの人は診断結果金額表示ページへ
                currentStep = '6a';
                showStep(currentStep);
            } else {
                // それ以外の人はLINE誘導ページへ
                currentStep = '6b';
                showStep(currentStep);
            }
        }
    }
}

// 診断結果を計算する関数
function calculateResult() {
    let totalScore = basePrice;
    
    // 各質問の回答に基づいて加算
    for (let questionKey in surveyAnswers) {
        const answer = surveyAnswers[questionKey];
        if (scoringData[questionKey] && scoringData[questionKey][answer] !== undefined) {
            const addScore = scoringData[questionKey][answer];
            totalScore += addScore;
        }
    }
    
    // 予算範囲を決定
    const budgetRange = determineBudgetRange(totalScore);
    
    // 結果ページのURLを更新
    updateResultPage(budgetRange, totalScore);
}

// 予算範囲を決定する関数
function determineBudgetRange(score) {
    for (let i = 0; i < budgetRanges.length; i++) {
        const range = budgetRanges[i];
        if (score >= range.min && score <= range.max) {
            return range;
        }
    }
    // どの範囲にも当てはまらない場合は最後の範囲を返す
    return budgetRanges[budgetRanges.length - 1];
}

// 結果ページを更新する関数
function updateResultPage(budgetRange, totalScore) {
    // 少し遅延を入れてDOMが確実に更新されるのを待つ
    setTimeout(() => {
        // LINE ボタンのURLを更新（step6b用）
        const lineBtn = document.querySelector('#step6b .line-btn');
        if (lineBtn) {
            lineBtn.href = budgetRange.url;
            lineBtn.setAttribute('target', '_blank'); // 新しいタブで開く
        }
        
        // step6aの予算範囲を表示
        updateBudgetDisplay(budgetRange);
    }, 100);
}

// 予算範囲表示を更新する関数
function updateBudgetDisplay(budgetRange) {
    const budgetElement = document.getElementById('calculatedBudgetRange');
    
    if (budgetElement && budgetRange) {
        budgetElement.textContent = `${budgetRange.min.toLocaleString()}~${budgetRange.max.toLocaleString()}`;
    }
}


function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
}

function validateCurrentStep() {
    
    switch(currentStep) {
        case 1:
            // ステップ1: 階数、LDKサイズ、LDKの形、子ども部屋、和室
            const hasFloors = surveyAnswers['q1'] !== undefined;
            const hasLdkSize = surveyAnswers['ldk-size'] !== undefined;
            const hasLdkShape = surveyAnswers['ldk-shape'] !== undefined;
            const hasChildrenRoom = surveyAnswers['children-room'] !== undefined;
            const hasJapaneseRoom = surveyAnswers['japanese-room'] !== undefined;
            
            if (!hasFloors) {
                alert('階数を選択してください。');
                scrollToQuestion('q1');
                return false;
            }
            if (!hasLdkSize) {
                alert('LDKの広さを選択してください。');
                scrollToQuestion('ldk-size');
                return false;
            }
            if (!hasLdkShape) {
                alert('LDKの形を選択してください。');
                scrollToQuestion('ldk-shape');
                return false;
            }
            if (!hasChildrenRoom) {
                alert('子ども部屋について選択してください。');
                scrollToQuestion('children-room');
                return false;
            }
            if (!hasJapaneseRoom) {
                alert('和室について選択してください。');
                scrollToQuestion('japanese-room');
                return false;
            }
            break;
            
        case 2:
            // ステップ2: キッチンスタイル、キッチン配置
            const hasKitchenStyle = surveyAnswers['kitchen-style'] !== undefined;
            const hasKitchenLayout = surveyAnswers['kitchen-layout'] !== undefined;
            
            if (!hasKitchenStyle) {
                alert('キッチンのスタイルを選択してください。');
                scrollToQuestion('kitchen-style');
                return false;
            }
            if (!hasKitchenLayout) {
                alert('キッチンとダイニングの配置を選択してください。');
                scrollToQuestion('kitchen-layout');
                return false;
            }
            break;
            
        case 3:
            // ステップ3: 寝室収納、衣服収納
            const hasBedroomStorage = surveyAnswers['bedroom-storage'] !== undefined;
            const hasClothingStorage = surveyAnswers['clothing-storage'] !== undefined;
            
            if (!hasBedroomStorage) {
                alert('寝室収納を選択してください。');
                scrollToQuestion('bedroom-storage');
                return false;
            }
            if (!hasClothingStorage) {
                alert('衣服収納を選択してください。');
                scrollToQuestion('clothing-storage');
                return false;
            }
            break;
            
        case 4:
            // ステップ4: 玄関、階段、バルコニー、吹き抜け、洗面所
            const hasEntrance = surveyAnswers['entrance'] !== undefined;
            const hasStairs = surveyAnswers['stairs'] !== undefined;
            const hasBalcony = surveyAnswers['balcony'] !== undefined;
            const hasAtrium = surveyAnswers['atrium'] !== undefined;
            const hasWashroom = surveyAnswers['washroom'] !== undefined;
            
            if (!hasEntrance) {
                alert('玄関のタイプを選択してください。');
                scrollToQuestion('entrance');
                return false;
            }
            if (!hasStairs) {
                alert('階段のタイプを選択してください。');
                scrollToQuestion('stairs');
                return false;
            }
            if (!hasBalcony) {
                alert('バルコニーの必要性を選択してください。');
                scrollToQuestion('balcony');
                return false;
            }
            if (!hasAtrium) {
                alert('吹き抜けの有無を選択してください。');
                scrollToQuestion('atrium');
                return false;
            }
            if (!hasWashroom) {
                alert('洗面所のタイプを選択してください。');
                scrollToQuestion('washroom');
                return false;
            }
            break;
            
        case 5:
            // ステップ5: アンケート - 参考媒体と現在の状況は必須
            const hasReferenceMedia = document.querySelectorAll('input[name="reference-media"]:checked').length > 0;
            const hasCurrentStatus = document.querySelectorAll('input[name="current-status"]:checked').length > 0;
            
            if (!hasReferenceMedia) {
                alert('家づくりで参考にしている媒体を選択してください。');
                document.querySelector('input[name="reference-media"]').closest('.question-section').scrollIntoView({ behavior: 'smooth' });
                return false;
            }
            if (!hasCurrentStatus) {
                alert('現在の状況を選択してください。');
                document.querySelector('input[name="current-status"]').closest('.question-section').scrollIntoView({ behavior: 'smooth' });
                return false;
            }
            break;
    }
    
    return true;
}

// 未回答の質問までスクロールする関数
function scrollToQuestion(questionKey) {
    let targetElement = null;
    
    // 質問タイプに応じて対象要素を特定
    switch(questionKey) {
        case 'q1':
            targetElement = document.querySelector('input[name="q1"]').closest('.question-section');
            break;
        case 'ldk-size':
            targetElement = document.querySelector('.room-images').closest('.question-section');
            break;
        case 'ldk-shape':
            targetElement = document.querySelector('.layout-options').closest('.question-section');
            break;
        case 'children-room':
            targetElement = document.querySelector('input[name="children-room"]').closest('.question-section');
            break;
        case 'japanese-room':
            targetElement = document.querySelector('.interior-images').closest('.question-section');
            break;
        case 'kitchen-style':
            targetElement = document.querySelector('.kitchen-images').closest('.question-section');
            break;
        case 'kitchen-layout':
            targetElement = document.querySelector('.kitchen-layout-images').closest('.question-section');
            break;
        case 'bedroom-storage':
            targetElement = document.querySelector('.storage-sections').closest('.question-section');
            break;
        case 'clothing-storage':
            // 2番目のstorage-sectionsを探す
            const storageSections = document.querySelectorAll('.storage-sections');
            if (storageSections.length > 1) {
                targetElement = storageSections[1].closest('.question-section');
            }
            break;
        case 'entrance':
            targetElement = document.querySelector('.entrance-images').closest('.question-section');
            break;
        case 'stairs':
            targetElement = document.querySelector('.stairs-images').closest('.question-section');
            break;
        case 'balcony':
            targetElement = document.querySelector('input[name="balcony"]').closest('.question-section');
            break;
        case 'atrium':
            targetElement = document.querySelector('.atrium-images').closest('.question-section');
            break;
        case 'washroom':
            targetElement = document.querySelector('.facilities-images').closest('.question-section');
            break;
    }
    
    // 要素が見つかった場合、スクロール
    if (targetElement) {
        // モバイル対応のスクロール処理
        const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - 100; // ヘッダー分のオフセット
        
        // iOS Safari対応のスムーズスクロール
        try {
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        } catch (e) {
            // 古いブラウザ用のフォールバック
            window.scrollTo(0, offsetPosition);
        }
        
        // モバイルでも確実に動作するようにスクロール完了を待つ
        setTimeout(() => {
            // 再度位置を確認して必要ならスクロール
            const newPosition = targetElement.getBoundingClientRect().top;
            if (Math.abs(newPosition) > 150) {
                targetElement.scrollIntoView({
                    behavior: 'auto',
                    block: 'center'
                });
            }
            
            // ハイライト処理
            targetElement.style.border = '3px solid #ff6347';
            targetElement.style.borderRadius = '8px';
            targetElement.style.backgroundColor = '#fff5f5';
            targetElement.style.transition = 'all 0.3s ease';
            
            // 3秒後にハイライトを削除
            setTimeout(() => {
                targetElement.style.border = '';
                targetElement.style.borderRadius = '';
                targetElement.style.backgroundColor = '';
            }, 3000);
        }, 500);
    }
}

// 収納セクションのトグル機能
function toggleStorage(type) {
    if (type === 'closet') {
        document.getElementById('closet-images').classList.toggle('hidden');
        document.getElementById('walkin-images').classList.add('hidden');
        
        // ボタンの状態を更新
        event.target.classList.toggle('selected');
        document.querySelector('[onclick="toggleStorage(\'walkin\')"]').classList.remove('selected');
    } else if (type === 'walkin') {
        document.getElementById('walkin-images').classList.toggle('hidden');
        document.getElementById('closet-images').classList.add('hidden');
        
        // ボタンの状態を更新
        event.target.classList.toggle('selected');
        document.querySelector('[onclick="toggleStorage(\'closet\')"]').classList.remove('selected');
    }
}

function toggleClothingStorage(type) {
    if (type === 'individual') {
        document.getElementById('individual-storage').classList.remove('hidden');
        document.getElementById('family-storage').classList.add('hidden');
        
        // ボタンの状態を更新
        document.querySelector('[onclick="toggleClothingStorage(\'individual\')"]').classList.add('selected');
        document.querySelector('[onclick="toggleClothingStorage(\'family\')"]').classList.remove('selected');
    } else if (type === 'family') {
        document.getElementById('family-storage').classList.remove('hidden');
        document.getElementById('individual-storage').classList.add('hidden');
        
        // ボタンの状態を更新
        document.querySelector('[onclick="toggleClothingStorage(\'family\')"]').classList.add('selected');
        document.querySelector('[onclick="toggleClothingStorage(\'individual\')"]').classList.remove('selected');
    }
}

function toggleAdditional() {
    // 追加オプションのトグル処理
    event.target.classList.toggle('selected');
}

function toggleBoth() {
    // 両方選択のトグル処理
    event.target.classList.toggle('selected');
}

// 回答データを保存する関数
function saveAnswer(questionKey, answer) {
    surveyAnswers[questionKey] = answer;
}

// data属性がない場合の推測機能
function inferAndSaveAnswer(element, label) {
    let question = '';
    let answer = '';
    
    // 親要素のクラスから質問タイプを推測
    const parent = element.parentElement;
    if (parent.classList.contains('room-images')) {
        question = 'ldk-size';
        answer = label;
    } else if (parent.classList.contains('layout-options')) {
        question = 'ldk-shape';
        answer = label;
    } else if (parent.classList.contains('interior-images')) {
        question = 'japanese-room';
        if (label.includes('不要')) answer = '不要';
        else if (label.includes('LDK一体型')) answer = 'LDK一体型';
        else if (label.includes('独立型')) answer = '独立型';
    } else if (parent.classList.contains('kitchen-images')) {
        question = 'kitchen-style';
        if (label.includes('I型')) answer = 'I型';
        else if (label.includes('アイランド')) answer = 'アイランド';
        else if (label.includes('L型')) answer = 'L型';
        else if (label.includes('二の字型')) answer = '二の字型';
    } else if (parent.classList.contains('kitchen-layout-images')) {
        question = 'kitchen-layout';
        answer = label;
    } else if (parent.classList.contains('storage-sections')) {
        if (label.includes('クローゼット')) {
            question = 'bedroom-storage';
            answer = 'クローゼット';
        } else if (label.includes('ウォークイン')) {
            question = 'bedroom-storage';
            answer = 'ウォークイン';
        } else if (label.includes('各部屋')) {
            question = 'clothing-storage';
            answer = '個別収納';
        } else if (label.includes('ファミクロ')) {
            question = 'clothing-storage';
            answer = 'ファミクロ';
        }
    } else if (parent.classList.contains('entrance-images')) {
        question = 'entrance';
        if (label.includes('スッキリ')) answer = 'シンプル';
        else if (label.includes('ウォークスルー')) answer = 'ウォークスルー';
        else if (label.includes('土間収納')) answer = '土間収納';
    } else if (parent.classList.contains('stairs-images')) {
        question = 'stairs';
        answer = label;
    } else if (parent.classList.contains('atrium-images')) {
        question = 'atrium';
        if (label.includes('あり')) answer = 'あり';
        else answer = 'なし';
    } else if (parent.classList.contains('facilities-images')) {
        question = 'washroom';
        if (label.includes('別')) answer = '分離';
        else answer = '一体型';
    }
    
    if (question && answer) {
        saveAnswer(question, answer);
    }
}

// ラジオボタンとチェックボックスのクリック時の処理
document.addEventListener('DOMContentLoaded', function() {
    // ラジオボタンをクリックした時に親要素にスタイルを適用
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            // 同じnameグループのラジオボタンの親要素からスタイルを削除
            const name = this.name;
            document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
                r.closest('.answer-option').style.backgroundColor = '#f0f0f0';
            });
            
            // 選択されたラジオボタンの親要素にスタイルを適用
            if (this.checked) {
                this.closest('.answer-option').style.backgroundColor = '#e0e0e0';
                
                // 回答を保存
                saveAnswer(this.name, this.value);
            }
        });
    });
    
    // 画像選択の処理
    const imageSelections = document.querySelectorAll('.room-image, .layout-option, .interior-image, .kitchen-item, .kitchen-layout-item, .entrance-item, .stairs-item, .facilities-item, .atrium-item, .storage-item');
    imageSelections.forEach(item => {
        item.addEventListener('click', function() {
            // 同じグループ内の他の選択を解除
            const parent = this.parentElement;
            parent.querySelectorAll('.selected').forEach(selected => {
                selected.classList.remove('selected');
            });
            
            // クリックされた項目を選択
            this.classList.add('selected');
            
            // 選択状態のスタイルを適用
            this.style.border = '3px solid #ff6347';
            
            // 他の項目のボーダーをリセット
            parent.querySelectorAll(':not(.selected)').forEach(notSelected => {
                if (notSelected !== this) {
                    notSelected.style.border = '';
                }
            });
            
            // data属性から質問と回答を取得して保存
            const question = this.getAttribute('data-question');
            const answer = this.getAttribute('data-answer');
            if (question && answer) {
                saveAnswer(question, answer);
            } else {
                // data属性がない場合は、テキストから推測
                const label = this.querySelector('span').textContent;
                inferAndSaveAnswer(this, label);
                
                // 「③不要」「③両方ほしい」などのテキストを処理
                if (label.includes('不要') && parent.classList.contains('storage-sections')) {
                    // 最初のstorage-sectionsなら寝室収納
                    const allStorageSections = document.querySelectorAll('.storage-sections');
                    if (parent === allStorageSections[0]) {
                        saveAnswer('bedroom-storage', '不要');
                    }
                } else if (label.includes('両方')) {
                    // 2番目のstorage-sectionsなら衣服収納
                    const allStorageSections = document.querySelectorAll('.storage-sections');
                    if (parent === allStorageSections[1]) {
                        saveAnswer('clothing-storage', '両方');
                    }
                }
            }
        });
    });
    
    // 初期表示の設定
    showStep(1);
    
    // デフォルトURLを設定（テスト用）
    const lineBtn = document.querySelector('.line-btn');
    if (lineBtn) {
        // hrefが#または空の場合、デフォルトURLを設定
        if (!lineBtn.href || lineBtn.href.endsWith('#')) {
            lineBtn.href = budgetRanges[0].url; // 最初の範囲のURLをデフォルトに
        }
    }
    
    // ブラウザの戻る/進むボタンの対応
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.step) {
            currentStep = event.state.step;
            showStep(currentStep);
        }
    });
    
    // 初期状態をhistoryに追加
    history.replaceState({step: currentStep}, '', `#step${currentStep}`);
});

// 選択された画像のスタイル
const style = document.createElement('style');
style.textContent = `
    .room-image.selected,
    .layout-option.selected,
    .interior-image.selected,
    .kitchen-item.selected,
    .kitchen-layout-item.selected,
    .entrance-item.selected,
    .stairs-item.selected,
    .facilities-item.selected {
        position: relative;
    }
    
    .room-image.selected::after,
    .layout-option.selected::after,
    .interior-image.selected::after,
    .kitchen-item.selected::after,
    .kitchen-layout-item.selected::after,
    .entrance-item.selected::after,
    .stairs-item.selected::after,
    .facilities-item.selected::after {
        content: '✓';
        position: absolute;
        top: 5px;
        right: 5px;
        background-color: #ff6347;
        color: white;
        width: 25px;
        height: 25px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
    }
`;
document.head.appendChild(style);