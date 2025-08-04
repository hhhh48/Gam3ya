const homePage = document.getElementById('home-page');
const gam3iyaPage = document.getElementById('gam3iya-page');
const backButton = document.getElementById('back-button');
let currentAssociationId = null;
let associations = [];

// Load data from local storage
function loadData() {
    const data = localStorage.getItem('gam3iyaData');
    if (data) {
        associations = JSON.parse(data);
    }
}

// Save data to local storage
function saveData() {
    localStorage.setItem('gam3iyaData', JSON.stringify(associations));
}

// Function to fetch and display associations
function fetchAssociations() {
    loadData();
    const list = document.getElementById('associations-list');
    list.innerHTML = '';
    associations.forEach((assoc, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${assoc.name} - المبلغ: ${assoc.amount} جنيه</span>
            <div class="actions">
                <button onclick="showGam3iya(${index})">الدخول</button>
                <button onclick="editAssociation(${index})" class="edit-btn">تعديل</button>
                <button onclick="deleteAssociation(${index})" class="delete-btn">حذف</button>
            </div>
        `;
        list.appendChild(li);
    });
}

// Function to fetch and display a specific association's details
function showGam3iya(index) {
    currentAssociationId = index;
    const association = associations[index];
    
    document.getElementById('gam3iya-name').innerText = association.name;
    document.getElementById('gam3iya-amount').innerText = `المبلغ: ${association.amount} جنيه`;

    const membersList = document.getElementById('members-list');
    membersList.innerHTML = '';
    const winnerSelect = document.getElementById('winner-select');
    winnerSelect.innerHTML = '<option value="">اختر اسم المستلم</option>';
    
    association.members.forEach((member, memberIndex) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${member.name}</span>
            <div class="actions">
                <form onsubmit="event.preventDefault(); addPayment(event, ${memberIndex});">
                    <input type="number" name="paid_amount" placeholder="المبلغ" style="width:80px;" required>
                    <input type="number" name="paid_month" placeholder="الشهر" style="width:60px;" required>
                    <button type="submit">تسجيل</button>
                </form>
                <button onclick="editMemberName(${memberIndex})" class="edit-btn">تعديل الاسم</button>
                <button onclick="deleteMember(${memberIndex})" class="delete-btn">حذف</button>
            </div>
        `;
        membersList.appendChild(li);
        const option = document.createElement('option');
        option.value = memberIndex;
        option.innerText = member.name;
        winnerSelect.appendChild(option);
    });
    
    const paymentsList = document.getElementById('payments-list');
    paymentsList.innerHTML = '';
    association.payments.forEach(payment => {
        const memberName = association.members[payment.member_id].name;
        const li = document.createElement('li');
        li.innerText = `الاسم: ${memberName} - المبلغ: ${payment.paid_amount} جنيه - الشهر: ${payment.paid_month}`;
        paymentsList.appendChild(li);
    });
    
    const winnersList = document.getElementById('winners-list');
    winnersList.innerHTML = '';
    association.winners.forEach(winner => {
        const memberName = association.members[winner.member_id].name;
        const li = document.createElement('li');
        li.innerText = `الشهر ${winner.turn_number}. الاسم: ${memberName} - المبلغ: ${association.amount} جنيه`;
        winnersList.appendChild(li);
    });

    homePage.classList.add('hidden');
    gam3iyaPage.classList.remove('hidden');
}

// --- New Functions for Editing and Deleting ---

function editAssociation(index) {
    const association = associations[index];
    const newName = prompt(`تعديل اسم الجمعية:`, association.name);
    const newAmount = prompt(`تعديل مبلغ الجمعية:`, association.amount);

    if (newName !== null && newName.trim() !== '') {
        association.name = newName;
    }
    if (newAmount !== null && !isNaN(newAmount) && Number(newAmount) > 0) {
        association.amount = Number(newAmount);
    }
    saveData();
    fetchAssociations();
}

function deleteAssociation(index) {
    if (confirm(`هل أنت متأكد من حذف جمعية "${associations[index].name}"؟`)) {
        associations.splice(index, 1);
        saveData();
        fetchAssociations();
    }
}

function editMemberName(memberIndex) {
    const association = associations[currentAssociationId];
    const member = association.members[memberIndex];
    const newName = prompt(`تعديل اسم المشارك:`, member.name);

    if (newName !== null && newName.trim() !== '') {
        member.name = newName;
        saveData();
        showGam3iya(currentAssociationId);
    }
}

function deleteMember(memberIndex) {
    const association = associations[currentAssociationId];
    const memberName = association.members[memberIndex].name;
    
    if (confirm(`هل أنت متأكد من حذف المشارك "${memberName}"؟ سيتم حذف جميع دفعاته ومستحقاته.`)) {
        // Remove member
        association.members.splice(memberIndex, 1);

        // Remove payments and winners for this member
        association.payments = association.payments.filter(p => p.member_id !== memberIndex);
        association.winners = association.winners.filter(w => w.member_id !== memberIndex);
        
        // Update member IDs in payments and winners to reflect the new indices
        association.payments.forEach(p => {
            if (p.member_id > memberIndex) {
                p.member_id--;
            }
        });
        association.winners.forEach(w => {
            if (w.member_id > memberIndex) {
                w.member_id--;
            }
        });

        saveData();
        showGam3iya(currentAssociationId);
    }
}

// --- Form Submissions ---

document.getElementById('create-association-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('association-name').value;
    const amount = document.getElementById('association-amount').value;
    associations.push({ name, amount: Number(amount), members: [], payments: [], winners: [] });
    saveData();
    document.getElementById('create-association-form').reset();
    fetchAssociations();
});

document.getElementById('add-member-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('member-name').value;
    associations[currentAssociationId].members.push({ name });
    saveData();
    document.getElementById('add-member-form').reset();
    showGam3iya(currentAssociationId);
});

function addPayment(e, memberId) {
    const form = e.target;
    const paid_amount = form.querySelector('input[name="paid_amount"]').value;
    const paid_month = form.querySelector('input[name="paid_month"]').value;
    associations[currentAssociationId].payments.push({ 
        member_id: memberId, 
        paid_amount: Number(paid_amount), 
        paid_month: Number(paid_month) 
    });
    saveData();
    showGam3iya(currentAssociationId);
}

document.getElementById('add-winner-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const winner_id = document.getElementById('winner-select').value;
    const winner_month = document.getElementById('winner-month').value;
    associations[currentAssociationId].winners.push({ 
        member_id: Number(winner_id), 
        turn_number: Number(winner_month) 
    });
    saveData();
    document.getElementById('add-winner-form').reset();
    showGam3iya(currentAssociationId);
});

document.getElementById('reset-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (confirm("هل أنت متأكد من إعادة بدء الجمعية؟")) {
        associations[currentAssociationId].members = [];
        associations[currentAssociationId].payments = [];
        associations[currentAssociationId].winners = [];
        saveData();
        showGam3iya(currentAssociationId);
    }
});

backButton.addEventListener('click', () => {
    homePage.classList.remove('hidden');
    gam3iyaPage.classList.add('hidden');
    currentAssociationId = null;
    fetchAssociations();
});

// Initial fetch
fetchAssociations();