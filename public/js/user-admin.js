document.addEventListener('DOMContentLoaded', async () => {
const page = document.querySelector('.user-admin');

if (!page) {
    return;
}

const list = document.querySelector('#user-list');
const status = document.querySelector('#user-admin-status');

if (!list || !status) {
    console.error('The user administration page is missing required elements.');
    return;
}

const isAdmin = page.dataset.isAdmin === 'true';
let currentPage = 1;
const limit = 10;
let roleNames = [];
let currentTotalPages = 1;

const setStatus = (message, isError = false) => {
    status.textContent = message;
    status.classList.toggle('user-admin__status--error', isError);
};

const getRoleName = (user) => {
    if (typeof user.role === 'string') {
        return user.role;
    }

    if (user.role && typeof user.role === 'object') {
        return user.role.name || '';
    }

    return '';
};

const createInput = (labelText, value, name, type = 'text') => {
    const label = document.createElement('label');
    label.className = 'user-admin__field';
    label.textContent = labelText;

    const input = document.createElement('input');
    input.type = type;
    input.name = name;
    input.value = value || '';
    input.required = true;

    label.append(input);
    return label;
};

const createRoleSelect = (value) => {
    const label = document.createElement('label');
    label.className = 'user-admin__field';
    label.append(document.createTextNode('Role'));

    const select = document.createElement('select');
    select.name = 'role';
    select.required = true;

    roleNames.forEach((role) => {
        select.append(
            new Option(role, role, false, role === value)
        );
    });

    label.append(select);
    return label;
};

const createUserForm = (user) => {
    const form = document.createElement('form');
    form.className = 'user-admin__card';
    form.dataset.userId = user._id;

    form.append(
        createInput('Display name', user.displayName, 'displayName'),
        createInput('Username', user.username, 'username'),
        createInput('Email', user.email, 'email', 'email')
    );

    if (isAdmin) {
        form.append(createRoleSelect(getRoleName(user)));
    }

    const actions = document.createElement('div');
    actions.className = 'user-admin__actions';

    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.textContent = 'Save changes';
    actions.append(saveButton);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'user-admin__delete';
    deleteButton.textContent = 'Delete user';

    deleteButton.addEventListener('click', async () => {
        if (!window.confirm(`Delete ${user.displayName}?`)) {
            return;
        }

        deleteButton.disabled = true;

        try {
            await mutateUser(user._id, 'DELETE');
        } finally {
            deleteButton.disabled = false;
        }
    });

    actions.append(deleteButton);
    form.append(actions);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!form.reportValidity()) {
            return;
        }

        const formData = new FormData(form);
        const body = Object.fromEntries(formData.entries());

        saveButton.disabled = true;

        try {
            await mutateUser(user._id, 'PUT', body);
        } finally {
            saveButton.disabled = false;
        }
    });

    return form;
};

const updatePagination = (paginationData) => {
    const paginationControls = document.querySelector(
        '.user-admin__pagination'
    );

    if (!paginationControls) {
        return;
    }

    const pageLabel = paginationControls.querySelector(
        '.user-admin__page'
    );

    const previousButton = paginationControls.querySelector(
        '[data-page="previous"]'
    );

    const nextButton = paginationControls.querySelector(
        '[data-page="next"]'
    );

    const totalPages = Math.max(
        Number(paginationData.totalPages) || 0,
        1
    );

    const pageNumber = Number(paginationData.page) || 1;

    pageLabel.textContent = `Page ${pageNumber} of ${totalPages}`;
    previousButton.disabled = pageNumber <= 1;
    nextButton.disabled = pageNumber >= totalPages;
};

const renderUsers = (result) => {
    if (
        !result ||
        !Array.isArray(result.data) ||
        !result.pagination ||
        typeof result.pagination.page !== 'number' ||
        typeof result.pagination.totalPages !== 'number' ||
        typeof result.pagination.totalItems !== 'number'
    ) {
        throw new Error('The user API returned an invalid response.');
    }

    const { data: users, pagination } = result;

    currentPage = Math.max(1, pagination.page);
    currentTotalPages = Math.max(1, pagination.totalPages);

    list.replaceChildren();
    updatePagination(pagination);

    if (users.length === 0) {
        setStatus('No users found.');
        return;
    }

    const fragment = document.createDocumentFragment();

    users.forEach((user) => {
        fragment.append(createUserForm(user));
    });

    list.append(fragment);

    setStatus(
        `${pagination.totalItems} user${
            pagination.totalItems === 1 ? '' : 's'
        } found.`
    );
};

const readErrorMessage = async (response, fallbackMessage) => {
    try {
        const result = await response.json();
        return result.error || result.message || fallbackMessage;
    } catch {
        return fallbackMessage;
    }
};

const loadUsers = async () => {
    setStatus('Loading users...');

    const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(limit)
    });

    if (isAdmin) {
        const roleFilter = document.querySelector('#user-role-filter');
        const searchInput = document.querySelector('#user-search');

        if (roleFilter && roleFilter.value) {
            params.set('role', roleFilter.value);
        }

        if (searchInput && searchInput.value.trim()) {
            params.set('q', searchInput.value.trim());
        }
    }

    try {
        const response = await fetch(`/api/users?${params}`);

        if (response.status === 401) {
            window.location.href = '/auth/login';
            return;
        }

        if (!response.ok) {
            const message = await readErrorMessage(
                response,
                `Unable to load users (${response.status}).`
            );

            throw new Error(message);
        }

        const result = await response.json();

        renderUsers(result);
    } catch (error) {
        console.error('Unable to load users:', error);

        setStatus(
            error.message || 'An error occurred while loading users.',
            true
        );
    }
};

const mutateUser = async (id, method, body) => {
    setStatus(
        method === 'DELETE'
            ? 'Deleting user...'
            : 'Saving changes...'
    );

    try {
        const response = await fetch(`/api/users/${id}`, {
            method,
            headers: body
                ? { 'Content-Type': 'application/json' }
                : undefined,
            body: body ? JSON.stringify(body) : undefined
        });

        if (response.status === 401) {
            window.location.href = '/auth/login';
            return;
        }

        if (!response.ok) {
            const message = await readErrorMessage(
                response,
                'Unable to save changes.'
            );

            setStatus(message, true);
            return;
        }

        if (method === 'DELETE') {
            setStatus('User deleted successfully.');
        } else {
            setStatus('User updated successfully.');
        }

        /*
         * Reload the current page. If deleting the last user on a page
         * makes that page invalid, loadUsers will correct the page below.
         */
        await loadUsers();
    } catch (error) {
        console.error('Unable to update user:', error);

        setStatus(
            error.message || 'An error occurred while saving changes.',
            true
        );
    }
};

const populateRoleOptions = (select) => {
    if (!select) {
        return;
    }

    select.replaceChildren(new Option('All roles', ''));

    roleNames.forEach((role) => {
        select.append(new Option(role, role));
    });
};

if (isAdmin) {
    const controls = document.createElement('div');
    controls.className = 'user-admin__controls';

    controls.innerHTML = `
        <label>Search users
            <input
                id="user-search"
                type="search"
                placeholder="Name, username, or email"
            >
        </label>
        <label>Role
            <select id="user-role-filter"></select>
        </label>
        <button type="button" data-action="search">
            Apply filters
        </button>
    `;

    page.insertBefore(controls, status);

    controls
        .querySelector('[data-action="search"]')
        .addEventListener('click', async () => {
            currentPage = 1;
            await loadUsers();
        });

    controls
        .querySelector('#user-search')
        .addEventListener('keydown', async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                currentPage = 1;
                await loadUsers();
            }
        });
}

const pagination = document.createElement('nav');
pagination.className = 'user-admin__pagination';

pagination.innerHTML = `
    <button type="button" data-page="previous">Previous</button>
    <span class="user-admin__page"></span>
    <button type="button" data-page="next">Next</button>
`;

page.append(pagination);

pagination
    .querySelector('[data-page="previous"]')
    .addEventListener('click', async () => {
        if (currentPage > 1) {
            currentPage -= 1;
            await loadUsers();
        }
    });

pagination
    .querySelector('[data-page="next"]')
    .addEventListener('click', async () => {
        if (currentPage < currentTotalPages) {
            currentPage += 1;
            await loadUsers();
        }
    });

try {
    if (isAdmin) {
        setStatus('Loading roles...');

        const rolesResponse = await fetch('/api/roles');

        if (rolesResponse.status === 401) {
            window.location.href = '/auth/login';
            return;
        }

        if (!rolesResponse.ok) {
            const message = await readErrorMessage(
                rolesResponse,
                `Unable to load roles (${rolesResponse.status}).`
            );

            throw new Error(message);
        }

        const rolesResult = await rolesResponse.json();

        if (!Array.isArray(rolesResult)) {
            throw new Error('The roles API returned an invalid response.');
        }

        roleNames = rolesResult
            .map((role) => role?.name)
            .filter(
                (role) =>
                    typeof role === 'string' &&
                    role.trim().length > 0
            );

        if (roleNames.length === 0) {
            throw new Error('No roles are configured in the database.');
        }

        populateRoleOptions(
            document.querySelector('#user-role-filter')
        );
    }

    await loadUsers();
} catch (error) {
    console.error('Unable to initialize user administration:', error);

    setStatus(
        error.message || 'Unable to initialize user administration.',
        true
    );
}

});
