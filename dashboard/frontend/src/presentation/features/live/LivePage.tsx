import { useLiveStatus } from '../../../application/useLiveStatus'
import { dur } from '../../format'
import { Answer } from '../../ui/Answer'
import { Box, Pad } from '../../ui/Box'
import { Pulse } from '../../ui/Dot'
import { Grid, Page, Stack } from '../../ui/Layout'
import { StepList } from '../../ui/StepList'
import { Tag } from '../../ui/Tag'
import { Note } from '../../ui/Text'
import { Console } from './Console'
import { Meter } from './Meter'

export default function LivePage() {
  const live = useLiveStatus()
  if (!live) return <Page><Answer kind="no" chip="Carregando">Lendo o estado da máquina…</Answer></Page>
  const g = live.gpu
  return (
    <Page>
      <Answer kind={live.jobs.length ? 'warn' : 'ok'} chip={live.jobs.length ? 'Rodando' : 'Parado'}>
        {live.jobs.length ? <>Há <b>{live.jobs.length}</b> análise(s) em andamento. Esta tela atualiza a cada 2 segundos.</>
          : 'Nenhuma análise rodando agora. Quando você iniciar uma, ela aparece aqui.'}
      </Answer>
      <Note>Esta tela mostra o que o computador está fazendo agora. O <b>DiffDock</b> usa a placa de vídeo; o <b>Vina</b> usa só o processador, por isso a GPU pode ficar parada enquanto o docking roda. Os logs são o que cada script escreve enquanto trabalha.</Note>
      <Grid>
        <Box title="Placa de vídeo (GPU)"><Pad>
          {g ? <><Note style={{ display: 'block', marginBottom: 10 }}>{g.name}</Note>
            <Meter label="uso da GPU" value={g.util} max={100} unit="%" />
            <Meter label="memória da GPU" value={g.mem_used} max={g.mem_total} unit=" MiB" />
            <Meter label="temperatura" value={g.temp} max={100} unit=" °C" />
            <Note style={{ display: 'block', marginTop: 10 }}>Uso alto e memória cheia são normais durante o DiffDock. Acima de 85 °C, vale pausar para esfriar.</Note></>
            : <Note>GPU não disponível neste ambiente.</Note>}
        </Pad></Box>
        <Box title="Em execução">
          <StepList>
            {live.jobs.map(j => <li key={j.name}><Pulse /><span>{j.name}</span><Tag kind="run">{dur(j.seconds)}</Tag></li>)}
            {!live.jobs.length && <li><Note>Nada em execução.</Note></li>}
          </StepList>
        </Box>
      </Grid>
      <Stack>
        {live.logs.map(l => <Console key={l.file} {...l} />)}
        {!live.logs.length && <Box padded><Note>Nenhum log recente. Quando um script rodar, as últimas linhas dele aparecem aqui.</Note></Box>}
      </Stack>
    </Page>
  )
}
