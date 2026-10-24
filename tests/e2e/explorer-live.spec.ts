import {test,expect} from '@playwright/test';
test('propriedade alterada gera nova prévia validada',async({page})=>{
 await page.goto('/?screen=explorador-primitivos');
 await page.getByLabel('Buscar componente').fill('Carousel');
 await page.getByRole('button',{name:'Carousel',exact:true}).click();
 await expect(page.getByTestId('safe-carousel')).toBeVisible();
 const next=page.getByRole('button',{name:/next|próxim/i}).last();
 const prev=page.getByRole('button',{name:/previous|anterior/i}).last();
 for(const button of [next,prev]){
  const rect=await button.boundingBox();
  const viewport=page.viewportSize();
  expect(rect).toBeTruthy();expect(viewport).toBeTruthy();
  expect(rect!.x).toBeGreaterThanOrEqual(0);
  expect(rect!.x+rect!.width).toBeLessThanOrEqual(viewport!.width+1);
 }
 await page.getByLabel(/^items · json/i).fill(JSON.stringify([{title:'Card editado',description:'Editor em tempo real'}]));
 await expect(page.getByText('Card editado',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Restaurar valores'}).click();
 await expect(page.getByText('Descoberta',{exact:true})).toBeVisible();
});
