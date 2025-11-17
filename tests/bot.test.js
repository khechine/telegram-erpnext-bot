const erpnext = require('../src/services/erpnext');
const rasaService = require('../src/services/rasa');

describe('ERPNext Service', () => {
  test('should have a testConnection method', () => {
    expect(typeof erpnext.testConnection).toBe('function');
  });

  test('should have a createCustomer method', () => {
    expect(typeof erpnext.createCustomer).toBe('function');
  });

  test('should have a listCustomers method', () => {
    expect(typeof erpnext.listCustomers).toBe('function');
  });
});

describe('Rasa Service', () => {
  test('should have an analyze method', () => {
    expect(typeof rasaService.analyze).toBe('function');
  });

  test('should determine intent from text without Rasa', () => {
    const intent = rasaService.determineIntentFromText('liste des clients');
    expect(intent).toBe('list_customers');
  });

  test('should extract email from text', () => {
    const entities = rasaService.extractEntitiesFromText('Email: test@example.com');
    expect(entities.email).toBeDefined();
    expect(entities.email[0].value).toBe('test@example.com');
  });
});

describe('Intent Detection', () => {
  test('should detect customer creation intent', () => {
    const intent = rasaService.determineIntentFromText('créer un client');
    expect(intent).toBe('create_customer');
  });

  test('should detect list customers intent', () => {
    const intent = rasaService.determineIntentFromText('liste des clients');
    expect(intent).toBe('list_customers');
  });

  test('should detect sales report intent', () => {
    const intent = rasaService.determineIntentFromText('rapport des ventes');
    expect(intent).toBe('sales_report');
  });

  test('should detect dashboard intent', () => {
    const intent = rasaService.determineIntentFromText('dashboard');
    expect(intent).toBe('reports_menu');
  });
});
