
import { test, expect } from '@playwright/test';

test.describe('AI Builder Journey', () => {
    test('should create a project and trigger generation', async ({ page }) => {
        // 1. Go to Builder
        await page.goto('/builder');
        await expect(page.getByRole('heading', { name: 'My Projects' })).toBeVisible();

        // 2. Create Project
        const projectName = `Test Project ${Date.now()}`;
        const subdomain = `test-${Date.now()}`;
        await page.getByPlaceholder('Project Name').fill(projectName);
        await page.getByPlaceholder('Subdomain').fill(subdomain);
        await page.getByRole('button', { name: 'Create' }).click();

        // 3. Verify project created and navigate to it
        await expect(page.getByText(projectName)).toBeVisible();
        await page.click(`text=${projectName}`);

        // 4. Trigger AI Generation (Mocked environment)
        await page.getByPlaceholder('Describe the app you want to build').fill('Create a hello world component');
        await page.getByRole('button', { name: 'Generate with AI' }).click();

        // 5. Verify the builder state
        await expect(page).toHaveURL(/\/builder\/.*/);
        await expect(page.getByText(projectName)).toBeVisible();
    });
});
