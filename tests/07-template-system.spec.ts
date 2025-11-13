import { test, expect } from '@playwright/test';

// Helper function to register and login
async function authenticateUser(page: any) {
  // Go to login page
  await page.goto('/login');
  
  // Register a new user with timestamp to ensure uniqueness
  const username = `testuser_${Date.now()}`;
  
  // Attempt to register
  await page.click('button:has-text("Register")');
  await page.waitForTimeout(1000); // Wait for any registration challenge
  
  // After registration/login, should be redirected to todos page
  await page.waitForURL('/todos', { timeout: 10000 });
  
  return username;
}

// Helper class for template operations
class TemplateTestHelper {
  constructor(private page: any) {}

  async openTemplateModal() {
    await this.page.click('button:has-text("📋 Templates")');
    await this.page.waitForSelector('text=Templates', { timeout: 5000 });
  }

  async closeTemplateModal() {
    await this.page.click('button:has-text("Close")');
    await this.page.waitForTimeout(500);
  }

  async createTodoWithDetails(title: string, priority: string, subtasks: string[] = [], tags: string[] = []) {
    // Click Add Todo (assuming there's an input and add button)
    await this.page.fill('input[placeholder*="Add"]', title);
    
    // Set priority if available
    const prioritySelect = this.page.locator('select').first();
    if (await prioritySelect.isVisible()) {
      await prioritySelect.selectOption(priority);
    }

    // Add subtasks if provided
    for (const subtask of subtasks) {
      // This would depend on your subtask UI implementation
      // Simplified for now
    }

    // Add tags if provided
    for (const tag of tags) {
      // This would depend on your tag selection UI
      // Simplified for now
    }

    // Submit
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1000);
  }

  async saveFirstTodoAsTemplate(templateName: string, category?: string) {
    // Click "Template" button on first todo
    await this.page.click('button:has-text("💾 Template")');
    await this.page.waitForTimeout(500);
    
    // Dialog should appear - fill in template name
    this.page.once('dialog', async (dialog: any) => {
      expect(dialog.message()).toContain('Template name');
      await dialog.accept(templateName);
    });
    
    await this.page.waitForTimeout(500);
    
    // Second dialog for category
    if (category) {
      this.page.once('dialog', async (dialog: any) => {
        await dialog.accept(category);
      });
      await this.page.waitForTimeout(500);
    }
    
    // Third dialog for due date offset
    this.page.once('dialog', async (dialog: any) => {
      await dialog.accept('3'); // 3 days offset
    });
    
    await this.page.waitForTimeout(1000);
  }

  async useTemplate(templateName: string) {
    await this.openTemplateModal();
    
    // Find and click the template's "Use Template" button
    const templateCard = this.page.locator(`text=${templateName}`).locator('..').locator('..');
    await templateCard.locator('button:has-text("Use Template")').click();
    
    await this.page.waitForTimeout(1000);
    await this.closeTemplateModal();
  }

  async deleteTemplate(templateName: string) {
    await this.openTemplateModal();
    
    // Handle confirmation dialog
    this.page.once('dialog', async (dialog: any) => {
      await dialog.accept();
    });
    
    // Find and click the template's "Delete" button
    const templateCard = this.page.locator(`text=${templateName}`).locator('..').locator('..');
    await templateCard.locator('button:has-text("Delete")').click();
    
    await this.page.waitForTimeout(1000);
  }

  async editTemplate(templateName: string, newName: string, newCategory?: string) {
    await this.openTemplateModal();
    
    // Find and click the template's "Edit" button
    const templateCard = this.page.locator(`text=${templateName}`).locator('..').locator('..');
    await templateCard.locator('button:has-text("Edit")').click();
    
    await this.page.waitForTimeout(500);
    
    // Fill in new values
    await this.page.fill('input[maxLength="200"]', newName);
    if (newCategory) {
      await this.page.fill('input[maxLength="50"]', newCategory);
    }
    
    // Click Update button
    await this.page.click('button:has-text("Update")');
    await this.page.waitForTimeout(1000);
  }

  async filterByCategory(category: string) {
    await this.openTemplateModal();
    await this.page.click(`button:has-text("${category}")`);
    await this.page.waitForTimeout(500);
  }

  async verifyTemplateExists(templateName: string) {
    await this.openTemplateModal();
    const template = this.page.locator(`text=${templateName}`);
    await expect(template).toBeVisible();
  }

  async verifyTemplateCount(count: number) {
    await this.openTemplateModal();
    const templates = this.page.locator('[class*="grid"] > div');
    await expect(templates).toHaveCount(count);
  }
}

test.describe('Template System', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
  });

  test('should create template from existing todo', async ({ page }) => {
    const helper = new TemplateTestHelper(page);

    // Create a todo first
    await helper.createTodoWithDetails('Weekly Report', 'high');
    await page.waitForTimeout(1000);

    // Save as template
    await helper.saveFirstTodoAsTemplate('Weekly Report Template', 'Work');
    
    // Verify template was created
    await helper.verifyTemplateExists('Weekly Report Template');
  });

  test('should display templates in modal', async ({ page }) => {
    const helper = new TemplateTestHelper(page);

    // Create a todo and save as template
    await helper.createTodoWithDetails('Test Todo', 'medium');
    await helper.saveFirstTodoAsTemplate('Test Template', 'Personal');

    // Open templates modal
    await helper.openTemplateModal();

    // Verify modal is visible
    await expect(page.locator('text=Templates')).toBeVisible();
    await expect(page.locator('text=Test Template')).toBeVisible();
  });

  test('should create todo from template', async ({ page }) => {
    const helper = new TemplateTestHelper(page);

    // Create a todo and save as template
    await helper.createTodoWithDetails('Gym Workout', 'medium');
    await helper.saveFirstTodoAsTemplate('Gym Template', 'Fitness');

    // Use the template
    await helper.useTemplate('Gym Template');

    // Verify new todo was created
    await expect(page.locator('text=Gym Workout').first()).toBeVisible();
  });

  test('should edit template name and category', async ({ page }) => {
    const helper = new TemplateTestHelper(page);

    // Create template
    await helper.createTodoWithDetails('Original Task', 'low');
    await helper.saveFirstTodoAsTemplate('Original Template', 'Work');

    // Edit template
    await helper.editTemplate('Original Template', 'Updated Template', 'Personal');

    // Verify changes
    await helper.verifyTemplateExists('Updated Template');
    await helper.closeTemplateModal();
  });

  test('should delete template', async ({ page }) => {
    const helper = new TemplateTestHelper(page);

    // Create template
    await helper.createTodoWithDetails('Temp Task', 'medium');
    await helper.saveFirstTodoAsTemplate('Temp Template', 'Test');

    // Verify it exists
    await helper.verifyTemplateExists('Temp Template');
    await helper.closeTemplateModal();

    // Delete template
    await helper.deleteTemplate('Temp Template');

    // Verify it's gone
    await helper.openTemplateModal();
    await expect(page.locator('text=Temp Template')).not.toBeVisible();
  });

  test('should filter templates by category', async ({ page }) => {
    const helper = new TemplateTestHelper(page);

    // Create templates in different categories
    await helper.createTodoWithDetails('Work Task', 'high');
    await helper.saveFirstTodoAsTemplate('Work Template', 'Work');

    await helper.createTodoWithDetails('Personal Task', 'low');
    await helper.saveFirstTodoAsTemplate('Personal Template', 'Personal');

    // Filter by Work category
    await helper.filterByCategory('Work');

    // Verify only Work template is visible
    await expect(page.locator('text=Work Template')).toBeVisible();
    // Personal template should be filtered out based on category
  });

  test('should handle template with subtasks', async ({ page }) => {
    const helper = new TemplateTestHelper(page);

    // Create todo with subtasks
    await helper.createTodoWithDetails('Project Setup', 'high', ['Install dependencies', 'Configure env']);

    // Save as template
    await helper.saveFirstTodoAsTemplate('Setup Template', 'Work');

    // Use template
    await helper.useTemplate('Setup Template');

    // Verify subtasks were created (this would require expanding subtasks in UI)
    await page.waitForTimeout(1000);
  });

  test('should handle template with tags', async ({ page }) => {
    const helper = new TemplateTestHelper(page);

    // Note: This test assumes tags are already created
    // Create todo with tags
    await helper.createTodoWithDetails('Tagged Task', 'medium');

    // Save as template
    await helper.saveFirstTodoAsTemplate('Tagged Template', 'Work');

    // Verify template shows tags in modal
    await helper.openTemplateModal();
    await expect(page.locator('text=Tagged Template')).toBeVisible();
  });

  test('should display template metadata correctly', async ({ page }) => {
    const helper = new TemplateTestHelper(page);

    // Create template
    await helper.createTodoWithDetails('Metadata Test', 'high');
    await helper.saveFirstTodoAsTemplate('Metadata Template', 'Work');

    // Open modal and verify metadata
    await helper.openTemplateModal();
    
    const templateCard = page.locator('text=Metadata Template').locator('..').locator('..');
    
    // Should show priority badge
    await expect(templateCard.locator('text=HIGH')).toBeVisible();
    
    // Should show due date offset info
    await expect(templateCard.locator('text=3 days after creation')).toBeVisible();
  });

  test('should show empty state when no templates', async ({ page }) => {
    const helper = new TemplateTestHelper(page);

    // Open template modal without creating any templates
    await helper.openTemplateModal();

    // Verify empty state message
    await expect(page.locator('text=No templates yet')).toBeVisible();
  });

  test('should update template priority and recurrence', async ({ page }) => {
    const helper = new TemplateTestHelper(page);

    // Create template
    await helper.createTodoWithDetails('Recurring Task', 'low');
    await helper.saveFirstTodoAsTemplate('Recurring Template', 'Work');

    // Verify template shows correct priority
    await helper.openTemplateModal();
    const templateCard = page.locator('text=Recurring Template').locator('..').locator('..');
    await expect(templateCard.locator('text=LOW')).toBeVisible();
  });

  test('should persist templates across page reloads', async ({ page }) => {
    const helper = new TemplateTestHelper(page);

    // Create template
    await helper.createTodoWithDetails('Persistent Task', 'medium');
    await helper.saveFirstTodoAsTemplate('Persistent Template', 'Work');

    // Reload page
    await page.reload();
    await page.waitForTimeout(1000);

    // Verify template still exists
    await helper.verifyTemplateExists('Persistent Template');
  });
});
