import {test,expect} from '@playwright/test';

async function openComponent(page:import('@playwright/test').Page,type:string){
 await page.goto('/?screen=explorador-compostos');
 await page.getByLabel('Buscar componente').fill(type);
 await page.getByRole('button',{name:type,exact:true}).click();
 await expect(page.getByTestId('catalog-live-preview')).toBeVisible();
}

test('SiteCardsActivityGoal: altera objetivo com mínimo e máximo',async({page})=>{
 await openComponent(page,'SiteCardsActivityGoal');
 await expect(page.getByText('350',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Aumentar objetivo'}).click();
 await expect(page.getByText('360',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Set Goal'}).click();
 await expect(page.getByText(/Objetivo atualizado localmente/)).toBeVisible();
});

test('SiteCardsChat: envia mensagem sem chamada a serviço externo',async({page})=>{
 await openComponent(page,'SiteCardsChat');
 await page.getByTestId('catalog-live-preview').getByRole('textbox',{name:/Message|Mensagem/i}).fill('Mensagem local de teste');
 await page.getByRole('button',{name:'Send',exact:true}).click();
 await expect(page.getByText('Mensagem local de teste',{exact:true})).toBeVisible();
});

test('SiteCardsCookieSettings: itens opcionais alternam, necessário permanece bloqueado',async({page})=>{
 await openComponent(page,'SiteCardsCookieSettings');
 await page.getByLabel(/^showOptionalCookies · boolean/i).selectOption('true');
 await expect(page.getByTestId('catalog-live-preview').getByRole('switch',{name:/Strictly necessary/i})).toBeDisabled();
 await page.getByTestId('catalog-live-preview').getByRole('switch',{name:'Analytics'}).click();
 await expect(page.getByTestId('catalog-live-preview').getByRole('switch',{name:'Analytics'})).toBeChecked();
 await page.getByRole('button',{name:'Save preferences'}).click();
 await expect(page.getByText(/Nenhum cookie foi gravado/)).toBeVisible();
});

test('Explorer: edição content atualiza elemento do composto',async({page})=>{
 await openComponent(page,'SiteCardsActivityGoal');
 const field=page.getByLabel(/^content · json/i);
 await field.fill(JSON.stringify({'c001.description':'Meta ajustada pelo Pi'}));
 await expect(page.getByTestId('catalog-live-preview').getByText('Meta ajustada pelo Pi',{exact:true})).toBeVisible();
});

test('SiteCardsPaymentMethod: troca plano local sem pagamento',async({page})=>{
 await openComponent(page,'SiteCardsPaymentMethod');
 await page.getByRole('radio',{name:/Pro Plan/}).check();
 await expect(page.getByRole('radio',{name:/Pro Plan/})).toBeChecked();
 await page.getByRole('button',{name:'Select plan'}).click();
 await expect(page.getByTestId('catalog-live-preview').getByRole('status')).toContainText(/não há pagamento/i);
});

test('SiteCardsTeamMembers: altera papel na visualização sem alterar autorizações reais',async({page})=>{
 await openComponent(page,'SiteCardsTeamMembers');
 const role=page.getByRole('combobox',{name:'Papel de Jackson Lee'});
 await expect(role).toHaveValue('Developer');
 await role.selectOption('Viewer');
 await expect(role).toHaveValue('Viewer');
 await expect(page.getByText(/nenhuma permissão real é modificada/i)).toBeVisible();
});
