import { test, expect, Page } from '@playwright/test';

// Helper to authenticate user before each test
async function authenticateUser(page: Page) {
  await page.goto('/login');
  await page.waitForSelector('button:has-text("Register")', { timeout: 10000 });
  
  const username = `testuser_${Date.now()}`;
  await page.click('button:has-text("Register")');
  await page.waitForLoadState('networkidle');
  
  // Should be redirected to todos page
  await page.waitForURL('/todos', { timeout: 10000 });
  
  return username;
}

// Helper class for search and filter interactions
class FilterTestHelper {
  constructor(private page: Page) {}

  async searchTodos(searchTerm: string) {
    await this.page.fill('input[placeholder="Search todos..."]', searchTerm);
    // Wait for debounce
    await this.page.waitForTimeout(350);
  }

  async clearSearch() {
    const clearButton = this.page.locator('button[title="Clear search"]');
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }
  }

  async toggleAdvancedSearch() {
    await this.page.click('label:has-text("Include tags in search") input');
  }

  async openFilterPanel() {
    const filterButton = this.page.locator('button:has-text("Filters")');
    await filterButton.click();
    await this.page.waitForSelector('text="Status"', { timeout: 3000 });
  }

  async closeFilterPanel() {
    const filterButton = this.page.locator('button:has-text("Filters")');
    await filterButton.click();
  }

  async selectStatus(status: 'all' | 'incomplete' | 'completed') {
    await this.openFilterPanel();
    await this.page.click(`label:has-text("${status.charAt(0).toUpperCase() + status.slice(1)}") input[type="radio"]`);
  }

  async togglePriority(priority: 'high' | 'medium' | 'low') {
    await this.openFilterPanel();
    await this.page.click(`label:has-text("${priority.charAt(0).toUpperCase() + priority.slice(1)}") input[type="checkbox"]`);
  }

  async selectDueDateRange(range: string) {
    await this.openFilterPanel();
    await this.page.selectOption('select#due-date-range', range);
  }

  async toggleTagFilter(tagName: string) {
    await this.openFilterPanel();
    await this.page.click(`button:has-text("${tagName}")`);
  }

  async clearAllFilters() {
    await this.page.click('button:has-text("Clear All")');
  }

  async removeBadge(badgeText: string) {
    const badge = this.page.locator(`span:has-text("${badgeText}")`);
    await badge.locator('button').click();
  }

  async getTodoCount() {
    const todos = this.page.locator('.bg-\\[\\#1e293b\\].rounded-lg.p-4.border');
    return await todos.count();
  }

  async verifyFilterStats(showing: number, total: number) {
    await expect(this.page.locator(`text=Showing ${showing} of ${total} todos`)).toBeVisible();
  }

  async createTodo(title: string, options?: { priority?: string; tags?: string[] }) {
    await this.page.fill('input[placeholder="What needs to be done?"]', title);
    
    if (options?.priority) {
      await this.page.selectOption('select:has(option:has-text("High"))', options.priority);
    }
    
    // Add tags if specified
    if (options?.tags) {
      for (const tag of options.tags) {
        await this.page.click(`button:has-text("${tag}")`);
      }
    }
    
    await this.page.click('button:has-text("Add Todo")');
    await this.page.waitForTimeout(500);
  }

  async completeTodo(title: string) {
    const todo = this.page.locator(`div:has-text("${title}")`).first();
    await todo.locator('input[type="checkbox"]').check();
    await this.page.waitForTimeout(500);
  }

  async createTag(name: string, color: string = '#3B82F6') {
    await this.page.click('button:has-text("+ Manage Tags")');
    await this.page.fill('input[placeholder*="Work, Personal"]', name);
    const hexInput = this.page.locator('input[pattern*="A-Fa-f"]').first();
    await hexInput.fill(color);
    await this.page.click('button:has-text("Create Tag")');
    await this.page.waitForTimeout(500);
    
    // Close modal
    const closeButtons = this.page.locator('button:has-text("Close")');
    const count = await closeButtons.count();
    if (count > 0) {
      await closeButtons.last().click();
    }
  }
}

test.describe('Search & Filtering', () => {
  let helper: FilterTestHelper;

  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
    helper = new FilterTestHelper(page);
  });

  test('should filter todos by search term in title', async ({ page }) => {
    // Create test todos
    await helper.createTodo('Buy groceries');
    await helper.createTodo('Write report');
    await helper.createTodo('Call dentist');

    // Search for "report"
    await helper.searchTodos('report');

    // Should show only matching todo
    const visibleTodos = await helper.getTodoCount();
    expect(visibleTodos).toBe(1);
    await expect(page.locator('text=Write report')).toBeVisible();
    await expect(page.locator('text=Buy groceries')).not.toBeVisible();
  });

  test('should clear search with X button', async ({ page }) => {
    await helper.createTodo('Buy groceries');
    await helper.createTodo('Write report');

    await helper.searchTodos('report');
    expect(await helper.getTodoCount()).toBe(1);

    await helper.clearSearch();
    expect(await helper.getTodoCount()).toBe(2);
  });

  test('should include tags in advanced search', async ({ page }) => {
    // Create tag
    await helper.createTag('urgent', '#FF0000');

    // Create todo with tag
    await helper.createTodo('Buy groceries', { tags: ['urgent'] });
    await helper.createTodo('Write report');

    // Enable advanced search
    await helper.toggleAdvancedSearch();

    // Search for "urgent"
    await helper.searchTodos('urgent');

    // Should show todo with urgent tag
    expect(await helper.getTodoCount()).toBe(1);
    await expect(page.locator('text=Buy groceries')).toBeVisible();
  });

  test('should filter by priority (single selection)', async ({ page }) => {
    await helper.createTodo('High priority task', { priority: 'high' });
    await helper.createTodo('Medium priority task', { priority: 'medium' });
    await helper.createTodo('Low priority task', { priority: 'low' });

    await helper.togglePriority('high');

    expect(await helper.getTodoCount()).toBe(1);
    await expect(page.locator('text=High priority task')).toBeVisible();
  });

  test('should filter by multiple priorities (OR logic)', async ({ page }) => {
    await helper.createTodo('High priority task', { priority: 'high' });
    await helper.createTodo('Medium priority task', { priority: 'medium' });
    await helper.createTodo('Low priority task', { priority: 'low' });

    await helper.togglePriority('high');
    await helper.togglePriority('medium');

    expect(await helper.getTodoCount()).toBe(2);
  });

  test('should filter by status (incomplete only)', async ({ page }) => {
    await helper.createTodo('Task 1');
    await helper.createTodo('Task 2');
    await helper.createTodo('Task 3');

    // Complete one task
    await helper.completeTodo('Task 2');

    // Filter for incomplete only
    await helper.selectStatus('incomplete');

    expect(await helper.getTodoCount()).toBe(2);
    await expect(page.locator('text=Task 1')).toBeVisible();
    await expect(page.locator('text=Task 3')).toBeVisible();
  });

  test('should filter by status (completed only)', async ({ page }) => {
    await helper.createTodo('Task 1');
    await helper.createTodo('Task 2');

    await helper.completeTodo('Task 1');

    await helper.selectStatus('completed');

    expect(await helper.getTodoCount()).toBe(1);
    await expect(page.locator('text=Task 1')).toBeVisible();
  });

  test('should filter by tag selection', async ({ page }) => {
    await helper.createTag('work', '#3B82F6');
    await helper.createTag('personal', '#10B981');

    await helper.createTodo('Work task', { tags: ['work'] });
    await helper.createTodo('Personal task', { tags: ['personal'] });
    await helper.createTodo('No tag task');

    await helper.toggleTagFilter('work');

    expect(await helper.getTodoCount()).toBe(1);
    await expect(page.locator('text=Work task')).toBeVisible();
  });

  test('should combine search + priority filter', async ({ page }) => {
    await helper.createTodo('Buy groceries', { priority: 'high' });
    await helper.createTodo('Buy books', { priority: 'low' });
    await helper.createTodo('Write report', { priority: 'high' });

    await helper.searchTodos('Buy');
    await helper.togglePriority('high');

    expect(await helper.getTodoCount()).toBe(1);
    await expect(page.locator('text=Buy groceries')).toBeVisible();
  });

  test('should display filter stats', async ({ page }) => {
    await helper.createTodo('Task 1', { priority: 'high' });
    await helper.createTodo('Task 2', { priority: 'medium' });
    await helper.createTodo('Task 3', { priority: 'low' });

    await helper.togglePriority('high');

    await helper.verifyFilterStats(1, 3);
  });

  test('should show empty state when no results', async ({ page }) => {
    await helper.createTodo('Buy groceries');

    await helper.searchTodos('nonexistent');

    await expect(page.locator('text=No todos match your filters')).toBeVisible();
    await expect(page.locator('button:has-text("Clear All Filters")')).toBeVisible();
  });

  test('should clear all filters with button', async ({ page }) => {
    await helper.createTodo('Task 1', { priority: 'high' });
    await helper.createTodo('Task 2', { priority: 'medium' });

    await helper.searchTodos('Task');
    await helper.togglePriority('high');

    // Clear all filters
    await helper.clearAllFilters();

    // All todos should be visible
    expect(await helper.getTodoCount()).toBe(2);
  });

  test('should remove individual filter badge', async ({ page }) => {
    await helper.createTodo('Task 1', { priority: 'high' });
    await helper.createTodo('Task 2', { priority: 'medium' });

    await helper.togglePriority('high');

    // Verify badge exists
    await expect(page.locator('span:has-text("Priority: High")')).toBeVisible();

    // Remove badge
    await helper.removeBadge('Priority: High');

    // All todos should be visible again
    expect(await helper.getTodoCount()).toBe(2);
  });

  test('should handle special characters in search', async ({ page }) => {
    await helper.createTodo('Todo with [brackets]');
    await helper.createTodo('Normal todo');

    await helper.searchTodos('[brackets]');

    expect(await helper.getTodoCount()).toBe(1);
    await expect(page.locator('text=Todo with [brackets]')).toBeVisible();
  });

  test('should handle Unicode/emoji in search', async ({ page }) => {
    await helper.createTodo('📝 Meeting notes');
    await helper.createTodo('Regular notes');

    await helper.searchTodos('📝');

    expect(await helper.getTodoCount()).toBe(1);
    await expect(page.locator('text=📝 Meeting notes')).toBeVisible();
  });

  test('should persist filters when creating new todo', async ({ page }) => {
    await helper.createTodo('Task 1', { priority: 'high' });

    await helper.togglePriority('high');
    expect(await helper.getTodoCount()).toBe(1);

    // Create new todo with high priority
    await helper.createTodo('Task 2', { priority: 'high' });

    // Filter should still be active and show both high priority todos
    expect(await helper.getTodoCount()).toBe(2);
  });

  test('should show correct count in filter button', async ({ page }) => {
    await helper.createTodo('Task 1');

    await helper.togglePriority('high');
    await helper.selectStatus('incomplete');

    // Button should show "(2)" for 2 active filters
    await expect(page.locator('button:has-text("Filters (2)")')).toBeVisible();
  });

  test('should handle no tags available state', async ({ page }) => {
    await helper.createTodo('Task 1');

    await helper.openFilterPanel();

    // Should show message about no tags
    await expect(page.locator('text=No tags available')).toBeVisible();
  });

  test('should filter by due date range (today)', async ({ page }) => {
    // Get today's date in YYYY-MM-DDTHH:MM format
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T12:00`;

    // Create todos with different due dates
    await page.fill('input[placeholder="What needs to be done?"]', 'Due today');
    await page.fill('input[type="datetime-local"]', today);
    await page.click('button:has-text("Add Todo")');
    await page.waitForTimeout(500);

    await helper.createTodo('No due date');

    await helper.selectDueDateRange('today');

    expect(await helper.getTodoCount()).toBe(1);
    await expect(page.locator('text=Due today')).toBeVisible();
  });

  test('should filter by no due date', async ({ page }) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T12:00`;

    // Create todo with due date
    await page.fill('input[placeholder="What needs to be done?"]', 'Due today');
    await page.fill('input[type="datetime-local"]', today);
    await page.click('button:has-text("Add Todo")');
    await page.waitForTimeout(500);

    // Create todo without due date
    await helper.createTodo('No due date');

    await helper.selectDueDateRange('no-due-date');

    expect(await helper.getTodoCount()).toBe(1);
    await expect(page.locator('text=No due date')).toBeVisible();
  });
});
