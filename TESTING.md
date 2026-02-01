# Testing Guide for Azure DevOps Gantt Extension

## Overview

This document provides detailed information about the testing infrastructure for the Azure DevOps Gantt Extension.

## Test Architecture

### Test Runner: Vitest

We use Vitest for its:
- Fast execution (Vite-powered)
- Native ESM support
- Jest-compatible API
- Built-in coverage reporting

### Testing Libraries

- **@testing-library/react**: Component testing utilities
- **@testing-library/jest-dom**: Custom DOM matchers
- **@testing-library/user-event**: User interaction simulation
- **jsdom**: Browser environment simulation

## Test Categories

### 1. Unit Tests (`src/test/unit/`)

Test individual functions and classes in isolation.

**Examples:**
- `GanttDataService.test.ts` - Data transformation logic
- `filtering.test.ts` - Filter function logic
- `date-calculations.test.ts` - Date utility functions

**Best Practices:**
- Test one concept per test
- Use descriptive test names
- Mock external dependencies

### 2. Component Tests (`src/test/components/`)

Test React components with rendered output.

**Examples:**
- `GanttToolbar.test.tsx` - Toolbar interactions
- `GanttChart.test.tsx` - Chart rendering and events

**Best Practices:**
- Test behavior, not implementation
- Use `screen` queries that reflect user experience
- Mock complex dependencies (like dhtmlx-gantt)

### 3. Integration Tests (`src/test/integration/`)

Test multiple components/services working together.

**Examples:**
- `data-flow.test.ts` - End-to-end data flow
- `performance.test.ts` - Performance benchmarks
- `edge-cases.test.ts` - Edge case handling

**Best Practices:**
- Use real service instances with mock data
- Test complete user workflows
- Include performance assertions

## Test Data

### Fixtures (`src/test/fixtures/`)

JSON files containing test data:

- `realistic-workitems.json` - 20 items with hierarchy
- `empty-state.json` - Empty dataset
- `large-dataset.json` - 100+ items for performance testing
- `edge-cases.json` - Problematic scenarios

### Mock Services (`src/services/__mocks__/`)

TypeScript classes for simulating services:

```typescript
// Example: Using MockWorkItemService
const service = new MockWorkItemService({
  name: 'custom',
  workItems: myTestData,
  delay: 50,  // Simulate network delay
  shouldError: false
});

const items = await service.queryWorkItems(filters);
```

Pre-built scenarios:
- `MockScenarios.empty()` - Empty dataset
- `MockScenarios.realistic()` - Realistic project data
- `MockScenarios.edgeCases()` - Edge cases
- `MockScenarios.largeDataset(n)` - N random items
- `MockScenarios.deepHierarchy(n)` - N-level hierarchy
- `MockScenarios.error(msg)` - Error scenario

## Running Tests

### Command Reference

```bash
# All tests
npm test

# Watch mode (for development)
npm run test:watch

# With coverage
npm run test:coverage

# Specific suites
npm run test:unit
npm run test:components
npm run test:integration

# Debug mode
npx vitest --inspect-brk
```

### Watch Mode Commands

When running `npm run test:watch`:
- `a` - Run all tests
- `f` - Run only failed tests
- `p` - Filter by filename pattern
- `t` - Filter by test name pattern
- `q` - Quit

## Coverage Configuration

Coverage thresholds (in `vitest.config.ts`):
```typescript
thresholds: {
  lines: 80,
  functions: 80,
  branches: 75,
  statements: 80
}
```

Coverage reports generated:
- Terminal output
- HTML report (`coverage/index.html`)
- LCOV report (`coverage/lcov.info`)

## Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MyClass } from '../path/to/module';

describe('MyClass', () => {
  let instance: MyClass;

  beforeEach(() => {
    instance = new MyClass();
  });

  describe('methodName', () => {
    it('should do something specific', () => {
      const result = instance.methodName();
      expect(result).toBe(expectedValue);
    });

    it('should handle edge case', () => {
      // Test edge case
    });
  });
});
```

### Component Test Template

```typescript
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '../components/MyComponent';

describe('MyComponent', () => {
  const defaultProps = {
    prop1: 'value',
    onEvent: vi.fn()
  };

  it('renders correctly', () => {
    render(<MyComponent {...defaultProps} />);
    expect(screen.getByText('Expected Content')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    render(<MyComponent {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(defaultProps.onEvent).toHaveBeenCalled();
  });
});
```

### Integration Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { MockWorkItemService, MockScenarios } from '../services/__mocks__';
import { MockGanttDataService } from '../services/__mocks__';

describe('Integration: Feature Flow', () => {
  it('should complete full workflow', async () => {
    // Setup
    const workItemService = new MockWorkItemService(MockScenarios.realistic());
    const ganttDataService = new MockGanttDataService();

    // Execute
    const workItems = await workItemService.queryWorkItems();
    const ganttItems = ganttDataService.convertToGanttItems(workItems);

    // Verify
    expect(ganttItems.length).toBeGreaterThan(0);
  });
});
```

## Debugging Tests

### VS Code Configuration

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "--reporter=verbose"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Common Debugging Techniques

1. **Console Logging**: Use `console.log()` freely in tests
2. **Debug Mode**: Run with `--inspect-brk` and attach debugger
3. **Focused Tests**: Use `it.only()` or `describe.only()` to run specific tests
4. **Verbose Output**: Use `--reporter=verbose` for detailed output

## Troubleshooting

### Tests Fail with "Cannot find module"

Check that:
1. Module path is correct (relative to test file)
2. Module exports are correct
3. TypeScript path aliases are configured in `vitest.config.ts`

### Component Tests Fail to Render

Common issues:
1. Missing mock for external library (like dhtmlx-gantt)
2. Missing required props
3. Async operations not awaited

### Coverage is Low

1. Check coverage report in `coverage/index.html`
2. Add tests for uncovered code paths
3. Adjust thresholds if necessary

### Performance Tests are Flaky

1. Increase timeout thresholds
2. Run in isolated environment
3. Use consistent hardware in CI

## CI/CD Integration

Tests run automatically on:
- Pull requests to `main` branch
- Pushes to `main` and `develop` branches

See `.github/workflows/ci.yml` for configuration.

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain or improve coverage
4. Add integration tests for complex flows
5. Document any new test utilities
