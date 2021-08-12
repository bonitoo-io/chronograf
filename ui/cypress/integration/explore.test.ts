describe('Visualization', () => {
  beforeEach(cy.setupConnection)

  it('default connetion to influxdb v2', ()=> {
    cy.clickNav(8, 'Configuration')
    cy.get('h1')
    cy.getByTestID('set-conection-panel-body').contains('InfluxTest2 (Default)')
  })

  it('add data to explore', () => { 
    cy.clickNav(3, 'Explore')

    cy.get('[data-test=source-button-selector] > .dropdown > [data-test=wizard-bucket-selected]')
      .click()
    // selecting dynamic dropdown item
    cy.get('[data-test="dropdown--item"]')
      .each(($el, index, $list) => {
        if($el.text() == 'InfluxTest2'){
          $el.click()}
  })

    cy.getByTitle('Flux').click()
    cy.writeManualData('new_data', 'value=2')
    cy.writeManualData('new_data', 'value=2.5')
    cy.writeManualData('new_data', 'value=5.8')
    cy.writeManualData('new_data', 'value=3.7')
    cy.writeManualData('new_data', 'value=5')
    cy.writeManualData('new_data', 'value=2.5')
    cy.writeManualData('new_data', 'value=5.8')
    cy.writeManualData('new_data', 'value=3.7')
    
    cy.clickNav(4, 'Dashboards')
    cy.getByTitle('Create Dashboard').click()
    cy.getByTestID('rename-dashboard')
    //.clear()
    .type('explorer_test{enter}')
    cy.getByTestID('add-data-btn').click()

    cy.get('[data-test=source-button-selector] > .dropdown > [data-test=wizard-bucket-selected]')
      .click()
  
    // selecting dynamic dropdown item
    cy.get('[data-test="dropdown--item"]')
      .each(($el, index, $list) => {
        if($el.text() == 'InfluxTest2'){
          $el.click()}})
  
    cy.getByTitle('Flux').click()
    cy.getByTitle('Script Wizard')
})

it('create data queries in data explore',() =>{
  cy.visit('http://localhost:8888')

  cy.clickNav(4, 'Dashboards')
  cy.getByTitle('Create Dashboard').click()
  cy.getByTestID('rename-dashboard')
    .click()
    .type('explorer_test{enter}')
  cy.getByTestID('add-data-btn').click()

  cy.get('[data-test=source-button-selector] > .dropdown > [data-test=wizard-bucket-selected]')
      .click()
  
  // selecting dynamic dropdown item
  cy.get('[data-test="dropdown--item"]')
      .each(($el, index, $list) => {
        if($el.text() == 'InfluxTest2'){
          $el.click()}})
  
  cy.getByTitle('Flux').click()

  cy.get('[data-test=threesizer-header-controls] > .button-default').click('left')
  cy.get('.form--wrapper > :nth-child(1) > .dropdown > [data-test=wizard-bucket-selected]')
    .click()
  
  cy.getByTestID('dropdown--item')
    .filter(':contains("_tasks")')
    .click()
  cy.get(':nth-child(2) > .dropdown > [data-test=wizard-bucket-selected]')
    .click()
    .filter(':contains("new_data")').click()
  cy.get('.form--submit > .button').click()

  cy.getByTestID('rename-graph')
    .click()
    .clear()
    .type('Stacked line', {delay:100})

  cy. getByTitle('Visualization').click()
  cy.get('#StepPlot').click()
  cy.getByTestID('line-colours').click()
  cy.get('.color-dropdown--menu > .fancy-scroll--container > .fancy-scroll--view > :nth-child(5)')
    .click()
    
  cy.get('#SingleStat').click()
  cy.getByTestID('graph-container')
    .wait(500)

  cy.getByTestID('graph-container')
    .matchImageSnapshot('singleStat')

  cy.get('.color-dropdown > .btn').click()

  cy.getByTestID('base-colour')
    .each(($el: { text: () => string; click: () => void }, index: any, $list: any) => {
      if($el.text() == 'Thunder'){
        $el.click()}})

  cy.get(':nth-child(1) > .form-control').type('Amos ')
  cy.get('.graph-options-group > :nth-child(2) > .form-control').type('%')
  cy.getByTitle('Apply coloration to cell background').click()


  //edit graph
  cy.getByTitle('Save').click()

  cy.get('.dash-graph--container')
    .wait(500)
  cy.get('.dash-graph--container')
    .matchImageSnapshot('dashboardSingleStat')

    


})


})