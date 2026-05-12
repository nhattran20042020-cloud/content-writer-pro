document.addEventListener('DOMContentLoaded', () => {
    // --- UI ELEMENTS ---
    const briefForm = document.getElementById('briefForm');
    const resultCard = document.getElementById('resultCard');
    const loadingState = document.getElementById('loadingState');
    const contentOutputWrapper = document.getElementById('contentOutputWrapper');
    const markdownOutput = document.getElementById('markdownOutput');
    const generateBtn = document.getElementById('generateBtn');
    
    // Header & Actions
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const toast = document.getElementById('toast');
    
    // Multi-Brand Management
    const brandSelect = document.getElementById('brandSelect');
    const saveBrandBtn = document.getElementById('saveBrandBtn');
    const deleteBrandBtn = document.getElementById('deleteBrandBtn');
    
    // Form Inputs
    const productInput = document.getElementById('product');
    const targetInput = document.getElementById('targetAudience');
    const uspInput = document.getElementById('usp');
    const jargonInput = document.getElementById('jargon');
    const dnaInput = document.getElementById('brandDna');
    const referenceMaterial = document.getElementById('referenceMaterial');
    const winningContentSelect = document.getElementById('winningContentSelect');
    const generateVisualsCheckbox = document.getElementById('generateVisuals');

    // Winning Content
    const saveWinningBtn = document.getElementById('saveWinningBtn');

    // API Settings
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsContent = document.getElementById('settingsContent');
    const toggleIcon = document.querySelector('.toggle-icon');
    const apiProvider = document.getElementById('apiProvider');
    const apiKeyInput = document.getElementById('apiKey');
    const saveApiBtn = document.getElementById('saveApiBtn');
    const fetchModelsBtn = document.getElementById('fetchModelsBtn');
    const modelSelectGroup = document.getElementById('modelSelectGroup');
    const geminiModelSelect = document.getElementById('geminiModel');

    // History
    const historyBtn = document.getElementById('historyBtn');
    const historyModal = document.getElementById('historyModal');
    const closeHistoryBtn = document.getElementById('closeHistoryBtn');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    // Refine
    const refineSection = document.getElementById('refineSection');
    const refineInput = document.getElementById('refineInput');
    const refineBtn = document.getElementById('refineBtn');

    // State
    let currentFullPrompt = ""; // Context for refining

    // --- 1. LOAD API SETTINGS ---
    const savedProvider = localStorage.getItem('cw_api_provider') || 'gemini';
    const savedKey = localStorage.getItem('cw_api_key') || '';
    const savedModel = localStorage.getItem('cw_gemini_model') || 'gemini-1.5-flash-latest';
    
    apiProvider.value = savedProvider;
    apiKeyInput.value = savedKey;

    if (savedProvider === 'gemini' && savedKey) {
        modelSelectGroup.style.display = 'block';
        geminiModelSelect.value = savedModel;
    }

    // --- 2. MULTI-BRAND LOGIC ---
    function loadBrands() {
        const brands = JSON.parse(localStorage.getItem('cw_agency_brands') || '{}');
        brandSelect.innerHTML = '<option value="">-- Mới hoàn toàn (Tạo Trắng) --</option>';
        Object.keys(brands).forEach(bName => {
            const opt = document.createElement('option');
            opt.value = bName;
            opt.textContent = bName;
            brandSelect.appendChild(opt);
        });
        
        const lastUsed = localStorage.getItem('cw_last_used_brand');
        if(lastUsed && brands[lastUsed]) {
            brandSelect.value = lastUsed;
            populateBrandForm(brands[lastUsed]);
            deleteBrandBtn.style.display = 'inline-block';
        } else {
            deleteBrandBtn.style.display = 'none';
        }
    }

    function loadWinningContents() {
        const wc = JSON.parse(localStorage.getItem('cw_winning_contents') || '[]');
        winningContentSelect.innerHTML = '<option value="">-- Không sử dụng (Viết mới hoàn toàn) --</option>';
        wc.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.id;
            opt.textContent = item.title;
            winningContentSelect.appendChild(opt);
        });
    }

    saveWinningBtn.addEventListener('click', () => {
        const text = markdownOutput.dataset.raw || markdownOutput.innerText;
        if(!text) return alert("Chưa có bài viết nào để lưu!");
        const title = prompt("Nhập tên gợi nhớ cho Mẫu này (VD: Mẫu Ads Tôm hùm chốt đơn 15/4):");
        if(!title) return;

        const wc = JSON.parse(localStorage.getItem('cw_winning_contents') || '[]');
        wc.push({ id: Date.now().toString(), title: title, content: text });
        localStorage.setItem('cw_winning_contents', JSON.stringify(wc));
        loadWinningContents();
        showToast('Đã lưu vào kho Mẫu Winning Content!');
    });

    function populateBrandForm(brandData) {
        productInput.value = brandData.product || '';
        targetInput.value = brandData.target || '';
        uspInput.value = brandData.usp || '';
        jargonInput.value = brandData.jargon || '';
        dnaInput.value = brandData.dna || '';
    }

    brandSelect.addEventListener('change', () => {
        const brands = JSON.parse(localStorage.getItem('cw_agency_brands') || '{}');
        const selected = brandSelect.value;
        if(selected === "") {
            // Clear form
            productInput.value = ''; targetInput.value = ''; uspInput.value = '';
            jargonInput.value = ''; dnaInput.value = '';
            deleteBrandBtn.style.display = 'none';
            localStorage.removeItem('cw_last_used_brand');
        } else {
            populateBrandForm(brands[selected]);
            deleteBrandBtn.style.display = 'inline-block';
            localStorage.setItem('cw_last_used_brand', selected);
        }
    });

    saveBrandBtn.addEventListener('click', () => {
        let brandName = brandSelect.value;
        if(brandName === "") {
            brandName = prompt("Nhập tên cho Brand khách hàng này (VD: Vinpearl, Tôm Hùm Sống...):");
            if(!brandName) return;
        }
        
        const brands = JSON.parse(localStorage.getItem('cw_agency_brands') || '{}');
        brands[brandName] = {
            product: productInput.value.trim(),
            target: targetInput.value.trim(),
            usp: uspInput.value.trim(),
            jargon: jargonInput.value.trim(),
            dna: dnaInput.value.trim()
        };
        
        localStorage.setItem('cw_agency_brands', JSON.stringify(brands));
        localStorage.setItem('cw_last_used_brand', brandName);
        loadBrands();
        showToast('Đã lưu Brand: ' + brandName);
    });

    deleteBrandBtn.addEventListener('click', () => {
        const selected = brandSelect.value;
        if(!selected) return;
        if(confirm(`Bạn có chắc muốn xóa vĩnh viễn dữ liệu của khách hàng [${selected}]?`)) {
            const brands = JSON.parse(localStorage.getItem('cw_agency_brands') || '{}');
            delete brands[selected];
            localStorage.setItem('cw_agency_brands', JSON.stringify(brands));
            brandSelect.value = "";
            brandSelect.dispatchEvent(new Event('change'));
            loadBrands();
            showToast('Đã xóa Brand');
        }
    });

    // Initialize Multi-brand & Winning Contents
    loadBrands();
    loadWinningContents();

    // --- 3. BADGE SUGGESTIONS ---
    document.querySelectorAll('.badge').forEach(badge => {
        badge.addEventListener('click', (e) => {
            const containerId = e.target.parentElement.id;
            let targetInputId = '';
            if (containerId === 'uspSuggestions') targetInputId = 'usp';
            if (containerId === 'targetSuggestions') targetInputId = 'targetAudience';
            if (containerId === 'jargonSuggestions') targetInputId = 'jargon';

            if (targetInputId) {
                const input = document.getElementById(targetInputId);
                const currentVal = input.value.trim();
                input.value = currentVal ? currentVal + ', ' + e.target.textContent : e.target.textContent;
            }
        });
    });

    // --- 4. SETTINGS & MODEL FETCHING ---
    fetchModelsBtn.addEventListener('click', async () => {
        const key = apiKeyInput.value.trim();
        if (!key) return alert('Vui lòng nhập API Key trước!');
        const originalText = fetchModelsBtn.textContent;
        fetchModelsBtn.textContent = 'Đang tải...';
        fetchModelsBtn.disabled = true;

        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
            if (!res.ok) throw new Error('API Key không hợp lệ');
            const data = await res.json();
            const models = data.models.filter(m => m.supportedGenerationMethods?.includes('generateContent'));

            geminiModelSelect.innerHTML = '';
            models.forEach(m => {
                const modelId = m.name.replace('models/', '');
                const opt = document.createElement('option');
                opt.value = modelId;
                opt.textContent = `${m.displayName || modelId} (${modelId})`;
                geminiModelSelect.appendChild(opt);
            });
            modelSelectGroup.style.display = 'block';
            showToast('Tải model thành công!');
        } catch (err) { alert(err.message); } 
        finally { fetchModelsBtn.textContent = originalText; fetchModelsBtn.disabled = false; }
    });

    settingsToggle.addEventListener('click', () => {
        settingsContent.style.display = settingsContent.style.display === 'none' ? 'block' : 'none';
        toggleIcon.classList.toggle('open');
    });

    saveApiBtn.addEventListener('click', () => {
        localStorage.setItem('cw_api_provider', apiProvider.value);
        localStorage.setItem('cw_api_key', apiKeyInput.value.trim());
        if (modelSelectGroup.style.display !== 'none') {
            localStorage.setItem('cw_gemini_model', geminiModelSelect.value);
        }
        showToast('Đã lưu Cài đặt API!');
        settingsContent.style.display = 'none';
        toggleIcon.classList.remove('open');
    });

    // --- 5. MAIN FORM SUBMIT ---
    briefForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const key = localStorage.getItem('cw_api_key') || '';
        if (!key) {
            alert("Vui lòng mở 'Cài đặt API' và nhập API Key trước khi sử dụng!");
            settingsContent.style.display = 'block';
            toggleIcon.classList.add('open');
            return;
        }

        const product = productInput.value.trim();
        const usp = uspInput.value.trim();
        const targetAudience = targetInput.value.trim();
        const jargon = jargonInput.value.trim();
        const brandDna = dnaInput.value.trim();
        
        const channel = document.getElementById('channel').value;
        const goal = document.getElementById('goal').value;
        const tone = document.getElementById('tone').value;
        const angle = document.getElementById('angle').value;
        const length = document.getElementById('length').value;
        const generateVisuals = generateVisualsCheckbox.checked;
        const refMaterial = referenceMaterial.value.trim();
        const extraNotes = document.getElementById('extraNotes').value.trim();
        const selectedWcId = winningContentSelect.value;

        let userPrompt = `### THÔNG TIN BRAND:\n`;
        userPrompt += `- Sản phẩm/Dịch vụ: ${product}\n- Đối tượng KH: ${targetAudience}\n- USP: ${usp}\n`;
        if (brandDna) userPrompt += `- DNA Brand Voice (BẮT BUỘC): ${brandDna}\n`;
        if (jargon) userPrompt += `- THUẬT NGỮ BẮT BUỘC PHẢI DÙNG: ${jargon}. Hãy lồng ghép tự nhiên các thuật ngữ chuyên ngành này để thể hiện sự am hiểu thị trường.\n`;
        
        if (refMaterial) {
            userPrompt += `\n### TÀI LIỆU ĐẦU VÀO (Tham khảo/Fact-check):\n`;
            userPrompt += `${refMaterial}\n`;
            userPrompt += `(CHÚ Ý: Sử dụng các thông tin, số liệu từ tài liệu này làm nguyên liệu gốc, không tự bịa thông tin sai lệch).\n`;
        }

        if (selectedWcId) {
            const wcList = JSON.parse(localStorage.getItem('cw_winning_contents') || '[]');
            const wc = wcList.find(w => w.id === selectedWcId);
            if (wc) {
                userPrompt += `\n### KHUNG SƯỜN & NHỊP ĐIỆU CẦN MÔ PHỎNG (WINNING CONTENT):\n`;
                userPrompt += `${wc.content}\n`;
                userPrompt += `(BẮT BUỘC: Hãy phân tích nhịp điệu, cách đặt vấn đề, độ dài và cách chốt sale của bài viết mẫu trên, sau đó MÔ PHỎNG LẠI Y HỆT cấu trúc/phong cách đó cho sản phẩm mới này).\n`;
            }
        }

        userPrompt += `\n### YÊU CẦU JOB:\n`;
        userPrompt += `- Kênh đăng: ${channel}\n- Mục tiêu: ${goal}\n- Tone cơ bản: ${tone}\n`;
        userPrompt += `- Thời lượng yêu cầu: ${length}\n`;
        if (extraNotes) userPrompt += `- Ghi chú riêng: ${extraNotes}\n`;

        userPrompt += `\n### HƯỚNG DẪN ĐỊNH DẠNG & TRIỂN KHAI\n`;
        if (angle !== 'Để AI tự đề xuất 3 góc') {
            userPrompt += `- Góc tiếp cận: ${angle}. Áp dụng công thức Copywriting hoặc NLP phù hợp.\n`;
        } else {
            userPrompt += `- Brainstorm 3 góc content ở BƯỚC 2 trước, sau đó tự chọn góc tối ưu.\n`;
        }
        
        if (generateVisuals) {
            userPrompt += `- **ĐẶC BIỆT QUAN TRỌNG:** Vì đây là kịch bản đa phương tiện, ở BƯỚC 4, hãy kẻ một BẢNG PHÂN CẢNH gồm 3 cột: [Thời gian/Đoạn] | [Lời thoại/Nội dung Text] | [Visual Cues & Prompt Midjourney]. Cột Visual Cues phải mô tả chi tiết góc quay, âm thanh, hoặc cung cấp câu prompt tiếng Anh chuyên nghiệp cho AI sinh ảnh.\n`;
        } else {
            userPrompt += `- **ĐẶC BIỆT QUAN TRỌNG:** Ở BƯỚC 4, chỉ xuất ra một KỊCH BẢN SẠCH (Clean Text). Tuyệt đối KHÔNG kẻ bảng, KHÔNG chia cột Hình ảnh/Âm thanh (Visual/Audio), KHÔNG kèm các hướng dẫn quay dựng hay prompt hình ảnh.\n`;
        }

        currentFullPrompt = userPrompt; // Save for refining
        await executeGeneration(userPrompt, `[${brandSelect.value || 'Trắng'}] ${product} - ${channel}`);
    });

    // --- 6. REFINE / REGENERATE LOGIC ---
    refineBtn.addEventListener('click', async () => {
        const instruction = refineInput.value.trim();
        if (!instruction) return alert("Vui lòng nhập yêu cầu sửa đổi!");
        
        const previousContent = markdownOutput.dataset.raw || "";
        const userPrompt = `${currentFullPrompt}\n\n### BÀI VIẾT CŨ:\n${previousContent}\n\n### YÊU CẦU CHỈNH SỬA TỪ KHÁCH HÀNG:\n${instruction}\nHãy viết lại bản draft mới dựa trên feedback này. Giữ nguyên cấu trúc nếu không yêu cầu đổi.`;
        
        await executeGeneration(userPrompt, `Chỉnh sửa: ${instruction.substring(0, 30)}...`);
        refineInput.value = '';
    });

    // --- 7. EXECUTE API CALL ---
    async function executeGeneration(promptText, historyTitle) {
        const provider = localStorage.getItem('cw_api_provider') || 'gemini';
        const key = localStorage.getItem('cw_api_key') || '';
        const selectedModel = localStorage.getItem('cw_gemini_model') || 'gemini-1.5-flash-latest';

        resultCard.classList.remove('hidden');
        loadingState.classList.remove('hidden');
        contentOutputWrapper.classList.add('hidden');
        refineSection.classList.add('hidden');
        generateBtn.disabled = true;
        
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

        try {
            let resultText = "";
            if (provider === 'gemini') {
                resultText = await callGeminiAPI(key, selectedModel, CONTENT_WRITER_SKILL, promptText);
            } else {
                resultText = await callOpenAIAPI(key, CONTENT_WRITER_SKILL, promptText);
            }

            markdownOutput.innerHTML = marked.parse(resultText);
            markdownOutput.dataset.raw = resultText;
            
            saveHistory(historyTitle, resultText);
            
            loadingState.classList.add('hidden');
            contentOutputWrapper.classList.remove('hidden');
            refineSection.classList.remove('hidden');
            
        } catch (error) {
            console.error(error);
            loadingState.classList.add('hidden');
            contentOutputWrapper.classList.remove('hidden');
            markdownOutput.innerHTML = `<p style="color: #ef4444;">❌ Lỗi: ${error.message}</p>`;
        } finally {
            generateBtn.disabled = false;
        }
    }

    // --- 8. ACTIONS: COPY & DOWNLOAD ---
    copyBtn.addEventListener('click', () => {
        const text = markdownOutput.dataset.raw || markdownOutput.innerText;
        navigator.clipboard.writeText(text).then(() => showToast('Đã copy bài viết!'));
    });

    downloadBtn.addEventListener('click', () => {
        const text = markdownOutput.dataset.raw || markdownOutput.innerText;
        const blob = new Blob([text], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const brandName = brandSelect.value || 'Script';
        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `${brandName}_${dateStr}.md`;
        a.click();
        URL.revokeObjectURL(url);
    });

    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // --- 9. HISTORY MANAGEMENT ---
    function saveHistory(title, content) {
        const history = JSON.parse(localStorage.getItem('cw_history') || '[]');
        history.unshift({
            id: Date.now(),
            title: title,
            time: new Date().toLocaleString('vi-VN'),
            content: content
        });
        if(history.length > 50) history.pop();
        localStorage.setItem('cw_history', JSON.stringify(history));
    }

    historyBtn.addEventListener('click', () => {
        historyModal.classList.remove('hidden');
        renderHistory();
    });

    closeHistoryBtn.addEventListener('click', () => historyModal.classList.add('hidden'));
    
    clearHistoryBtn.addEventListener('click', () => {
        if(confirm("Xóa toàn bộ lịch sử Agency?")) {
            localStorage.removeItem('cw_history');
            renderHistory();
        }
    });

    function renderHistory() {
        const history = JSON.parse(localStorage.getItem('cw_history') || '[]');
        historyList.innerHTML = '';
        if(history.length === 0) {
            historyList.innerHTML = '<p style="color:#94a3b8;text-align:center;">Chưa có lịch sử nào.</p>';
            return;
        }

        history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="history-time">${item.time}</div>
                <div class="history-title">${item.title}</div>
            `;
            div.addEventListener('click', () => {
                markdownOutput.innerHTML = marked.parse(item.content);
                markdownOutput.dataset.raw = item.content;
                resultCard.classList.remove('hidden');
                contentOutputWrapper.classList.remove('hidden');
                refineSection.classList.remove('hidden');
                historyModal.classList.add('hidden');
                resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                showToast("Đã tải lại Job cũ!");
            });
            historyList.appendChild(div);
        });
    }

    // --- API Handlers ---
    async function callGeminiAPI(apiKey, modelId, systemPrompt, userPrompt) {
        let url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
        const payload = {
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ],
            generationConfig: { temperature: 0.7 }
        };

        let response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json();
            const errMsg = errData.error?.message || '';
            
            if (errMsg.includes('is not found') || errMsg.includes('not supported')) {
                console.log("Model not found, auto-fetching valid models...");
                const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                if (modelsRes.ok) {
                    const modelsData = await modelsRes.json();
                    const validModels = modelsData.models.filter(m => m.supportedGenerationMethods?.includes('generateContent'));
                    if (validModels.length > 0) {
                        const fallbackModelId = validModels[0].name.replace('models/', '');
                        localStorage.setItem('cw_gemini_model', fallbackModelId);
                        console.log("Retrying with fallback model:", fallbackModelId);
                        
                        url = `https://generativelanguage.googleapis.com/v1beta/models/${fallbackModelId}:generateContent?key=${apiKey}`;
                        response = await fetch(url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        
                        if (!response.ok) {
                            const err2 = await response.json();
                            throw new Error(err2.error?.message || 'Lỗi API Gemini sau khi thử lại');
                        }
                    } else {
                        throw new Error('API Key này không hỗ trợ model nào có thể viết bài!');
                    }
                } else {
                    throw new Error(errMsg);
                }
            } else {
                throw new Error(errMsg || 'Lỗi kết nối Gemini API');
            }
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    async function callOpenAIAPI(apiKey, systemPrompt, userPrompt) {
        // Implementation unchanged
    }
});
