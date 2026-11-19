
 /* ======================================
   CRECHE DA TIA WHEDJA
   CONEXÃO COM SUPABASE
====================================== */

const SUPABASE_URL = "https://ntdmtjxrgcwygdrhykvt.supabase.co";
const SUPABASE_KEY = "sb_publishable_7IXK4snKx-BorU3U0AOckQ_uUBG2RL5";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let pets = [];
let sistemaIniciado = false;


/* ======================================
   ELEMENTOS E FUNÇÕES AUXILIARES
====================================== */

const $ = id => document.getElementById(id);

function hoje() {
  const d = new Date();
  const local = new Date(
    d.getTime() - d.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 10);
}

function escapar(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}

function mensagem(texto) {
  alert(texto);
}

function mostrarPagina(nome) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.add("hidden");
  });

  const pagina = $(nome);

  if (pagina) {
    pagina.classList.remove("hidden");
  }

  document.querySelectorAll("nav button[data-page]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === nome);
  });
}


/* ======================================
   LOGIN
====================================== */

$("loginForm").addEventListener("submit", async e => {
  e.preventDefault();

  $("loginMessage").textContent = "Verificando acesso...";

  const { error } = await db.auth.signInWithPassword({
    email: $("email").value.trim(),
    password: $("password").value
  });

  if (error) {
    $("loginMessage").textContent =
      "Não foi possível entrar. Confira seu e-mail e sua senha.";

    console.error(error);
  }
});


async function sair() {
  const { error } = await db.auth.signOut();

  if (error) {
    mensagem(error.message);
  }
}

$("logout").addEventListener("click", sair);


db.auth.onAuthStateChange((event, session) => {
  if (session) {
    $("login").classList.add("hidden");
    $("app").classList.remove("hidden");
    $("loginMessage").textContent = "";

    if (!sistemaIniciado) {
      sistemaIniciado = true;
      iniciarSistema();
    }
  } else {
    sistemaIniciado = false;
    pets = [];

    $("app").classList.add("hidden");
    $("login").classList.remove("hidden");
  }
});


/* ======================================
   MENU DE NAVEGAÇÃO
====================================== */

document.querySelectorAll("nav button[data-page]").forEach(btn => {
  btn.addEventListener("click", () => {
    mostrarPagina(btn.dataset.page);
  });
});


/* ======================================
   INICIAR SISTEMA
====================================== */

async function iniciarSistema() {
  try {
    $("daycareDate").value = hoje();
    $("dataAvaliacao").value = hoje();
    $("dataVisita").value = hoje();

    mostrarPagina("dashboard");

    await carregarPets();
    await carregarCreche();
    await carregarHospedagem();
    await carregarAvaliacoes();
    await carregarVisitas();
    await atualizarPainel();

  } catch (error) {
    console.error("Erro ao iniciar o sistema:", error);
    mensagem("Ocorreu um erro ao carregar o sistema.");
  }
}


/* ======================================
   CADASTRO DE PETS
====================================== */

$("petForm").addEventListener("submit", async e => {
  e.preventDefault();

  const pet = {
    name: $("petName").value.trim(),
    tutor: $("tutorName").value.trim(),
    phone: $("phone").value.trim(),
    breed: $("breed").value.trim(),
    size: $("size").value,
    age: Number($("age").value) || null,
    observations: $("observations").value.trim()
  };

  const { error } = await db
    .from("pets")
    .insert(pet);

  if (error) {
    console.error(error);
    return mensagem(error.message);
  }

  mensagem("Pet cadastrado com sucesso!");

  e.target.reset();

  await carregarPets();
  await atualizarPainel();
});


async function carregarPets() {
  const { data, error } = await db
    .from("pets")
    .select("*")
    .order("name");

  if (error) {
    console.error(error);
    return mensagem(error.message);
  }

  pets = data || [];

  $("petList").innerHTML = pets.map(p => `
    <div class="item">
      <strong>${escapar(p.name)}</strong>
      <p>Tutor: ${escapar(p.tutor)}</p>
      <p>Telefone: ${escapar(p.phone)}</p>
      <p>Raça: ${escapar(p.breed)}</p>
      <p>Porte: ${escapar(p.size)}</p>
      <p>Idade: ${escapar(p.age ?? "-")}</p>
      <p>Observações: ${escapar(p.observations)}</p>

      <button type="button"
        onclick="excluirPet('${escapar(p.id)}')">
        Excluir cadastro
      </button>
    </div>
  `).join("") || "<p>Nenhum pet cadastrado.</p>";

  const options = pets.map(p => `
    <option value="${escapar(p.id)}">
      ${escapar(p.name)} - ${escapar(p.tutor)}
    </option>
  `).join("");

  const opcaoInicial =
    '<option value="">Selecione um pet</option>';

  $("daycarePet").innerHTML = opcaoInicial + options;
  $("stayPet").innerHTML = opcaoInicial + options;
  $("avaliacaoPet").innerHTML = opcaoInicial + options;
  $("visitaPet").innerHTML = opcaoInicial + options;
}


async function excluirPet(id) {
  if (!confirm("Deseja realmente excluir este pet?")) return;

  const { error } = await db
    .from("pets")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    return mensagem(error.message);
  }

  mensagem("Cadastro excluído.");

  await carregarPets();
  await atualizarPainel();
}


/* ======================================
   CONTROLE DE CRECHE
====================================== */

$("daycareForm").addEventListener("submit", async e => {
  e.preventDefault();

  const registro = {
    pet_id: $("daycarePet").value,
    date: $("daycareDate").value,
    entry_time: $("entryTime").value,
    exit_time: $("exitTime").value || null,
    payment: $("daycarePayment").value
  };

  const { error } = await db
    .from("daycare")
    .insert(registro);

  if (error) {
    console.error(error);
    return mensagem(error.message);
  }

  mensagem("Presença registrada com sucesso!");

  e.target.reset();
  $("daycareDate").value = hoje();

  await carregarCreche();
  await atualizarPainel();
});


async function carregarCreche() {
  const { data, error } = await db
    .from("daycare")
    .select("*, pets(name, tutor)")
    .order("date", { ascending: false })
    .order("entry_time", { ascending: false });

  if (error) {
    console.error(error);
    return mensagem(error.message);
  }

  $("daycareList").innerHTML = (data || []).map(r => `
    <div class="item">
      <strong>${escapar(r.pets?.name)}</strong>
      <p>Tutor: ${escapar(r.pets?.tutor)}</p>
      <p>Data: ${escapar(r.date)}</p>
      <p>Entrada: ${escapar(r.entry_time)}</p>
      <p>Saída: ${escapar(r.exit_time || "Ainda na creche")}</p>

      <span class="status">${escapar(r.payment)}</span>

      ${!r.exit_time ? `
        <button type="button"
          onclick="registrarSaida('${escapar(r.id)}')">
          Registrar saída
        </button>
      ` : ""}
    </div>
  `).join("") || "<p>Nenhum registro encontrado.</p>";
}


async function registrarSaida(id) {
  const horario = new Date().toLocaleTimeString(
    "pt-BR",
    { hour: "2-digit", minute: "2-digit" }
  );

  const { error } = await db
    .from("daycare")
    .update({ exit_time: horario })
    .eq("id", id);

  if (error) {
    console.error(error);
    return mensagem(error.message);
  }

  mensagem("Saída registrada!");

  await carregarCreche();
  await atualizarPainel();
}


/* ======================================
   CONTROLE DE HOSPEDAGEM
====================================== */

$("stayForm").addEventListener("submit", async e => {
  e.preventDefault();

  const entrada = $("checkin").value;
  const saida = $("checkout").value;
  const diaria = Number($("dailyRate").value);

  if (saida <= entrada) {
    return mensagem("A saída deve ser posterior à entrada.");
  }

  if (!Number.isFinite(diaria) || diaria <= 0) {
    return mensagem("Informe um valor de diária válido.");
  }

  const noites = Math.round(
    (
      new Date(saida + "T12:00:00") -
      new Date(entrada + "T12:00:00")
    ) / 86400000
  );

  const hospedagem = {
    pet_id: $("stayPet").value,
    checkin: entrada,
    checkout: saida,
    daily_rate: diaria,
    total: noites * diaria,
    payment: $("stayPayment").value,
    notes: $("stayNotes").value.trim(),
    status: "Hospedado"
  };

  const { error } = await db
    .from("stays")
    .insert(hospedagem);

  if (error) {
    console.error(error);
    return mensagem(error.message);
  }

  mensagem(
    `Hospedagem cadastrada!\n` +
    `${noites} diária(s)\n` +
    `Total: R$ ${hospedagem.total.toFixed(2)}`
  );

  e.target.reset();

  await carregarHospedagem();
  await atualizarPainel();
});


async function carregarHospedagem() {
  const { data, error } = await db
    .from("stays")
    .select("*, pets(name, tutor)")
    .order("checkin", { ascending: false });

  if (error) {
    console.error(error);
    return mensagem(error.message);
  }

  $("stayList").innerHTML = (data || []).map(h => `
    <div class="item">
      <strong>${escapar(h.pets?.name)}</strong>
      <p>Tutor: ${escapar(h.pets?.tutor)}</p>
      <p>Entrada: ${escapar(h.checkin)}</p>
      <p>Saída prevista: ${escapar(h.checkout)}</p>
      <p>Diária: R$ ${Number(h.daily_rate).toFixed(2)}</p>
      <p>Total: R$ ${Number(h.total).toFixed(2)}</p>
      <p>Observações: ${escapar(h.notes)}</p>

      <span class="status">${escapar(h.status)}</span>
      <span class="status">${escapar(h.payment)}</span>

      ${h.status !== "Finalizado" ? `
        <button type="button"
          onclick="finalizarHospedagem('${escapar(h.id)}')">
          Registrar check-out
        </button>
      ` : ""}
    </div>
  `).join("") || "<p>Nenhuma hospedagem cadastrada.</p>";
}


async function finalizarHospedagem(id) {
  if (!confirm("Confirmar o check-out deste pet?")) return;

  const { error } = await db
    .from("stays")
    .update({ status: "Finalizado" })
    .eq("id", id);

  if (error) {
    console.error(error);
    return mensagem(error.message);
  }

  mensagem("Check-out registrado!");

  await carregarHospedagem();
  await atualizarPainel();
}


/* ======================================
   AVALIAÇÃO DOS PETS
====================================== */

$("avaliacaoForm").addEventListener("submit", async e => {
  e.preventDefault();

  const pet = pets.find(
    p => String(p.id) === $("avaliacaoPet").value
  );

  if (!pet) {
    return mensagem("Selecione um pet.");
  }

  const registro = {
    pet_nome: pet.name,
    tutor_nome: pet.tutor,
    data_avaliacao: $("dataAvaliacao").value,
    comportamento: $("comportamento").value,
    socializacao: $("socializacao").value,
    alimentacao: $("alimentacao").value,
    observacoes: $("observacoesAvaliacao").value.trim()
  };

  const { error } = await db
    .from("avaliacoes")
    .insert(registro);

  if (error) {
    console.error(error);
    return mensagem(error.message);
  }

  mensagem("Avaliação salva com sucesso!");

  e.target.reset();
  $("dataAvaliacao").value = hoje();

  await carregarAvaliacoes();
  await atualizarPainel();
});


async function carregarAvaliacoes() {
  const { data, error } = await db
    .from("avaliacoes")
    .select("*")
    .order("data_avaliacao", { ascending: false });

  if (error) {
    console.error(error);
    return mensagem(error.message);
  }

  $("avaliacaoList").innerHTML = (data || []).map(a => `
    <div class="item">
      <strong>${escapar(a.pet_nome)}</strong>
      <p>Tutor: ${escapar(a.tutor_nome)}</p>
      <p>Data: ${escapar(a.data_avaliacao)}</p>
      <p>Comportamento: ${escapar(a.comportamento)}</p>
      <p>Socialização: ${escapar(a.socializacao)}</p>
      <p>Alimentação: ${escapar(a.alimentacao)}</p>
      <p>Observações: ${escapar(a.observacoes)}</p>
    </div>
  `).join("") || "<p>Nenhuma avaliação cadastrada.</p>";
}


/* ======================================
   VISITAS DOMICILIARES
====================================== */

$("visitaForm").addEventListener("submit", async e => {
  e.preventDefault();

  const pet = pets.find(
    p => String(p.id) === $("visitaPet").value
  );

  if (!pet) {
    return mensagem("Selecione um pet.");
  }

  const valor = Number($("valorVisita").value);

  if (!Number.isFinite(valor) || valor < 0) {
    return mensagem("Informe um valor válido para a visita.");
  }

  const registro = {
    pet_nome: pet.name,
    tutor_nome: pet.tutor,
    telefone: pet.phone || "",
    endereco: $("enderecoVisita").value.trim(),
    data_visita: $("dataVisita").value,
    hora_entrada: $("horaEntrada").value,
    hora_saida: $("horaSaida").value || null,
    servicos: $("servicosVisita").value.trim(),
    observacoes: $("observacoesVisita").value.trim(),
    valor: valor,
    payment: $("pagamentoVisita").value
  };

  const { error } = await db
    .from("visitas")
    .insert(registro);

  if (error) {
    console.error(error);
    return mensagem(error.message);
  }

  mensagem("Visita cadastrada com sucesso!");

  e.target.reset();
  $("dataVisita").value = hoje();

  await carregarVisitas();
  await atualizarPainel();
});


async function carregarVisitas() {
  const { data, error } = await db
    .from("visitas")
    .select("*")
    .order("data_visita", { ascending: false });

  if (error) {
    console.error(error);
    return mensagem(error.message);
  }

  $("visitaList").innerHTML = (data || []).map(v => `
    <div class="item">
      <strong>${escapar(v.pet_nome)}</strong>
      <p>Tutor: ${escapar(v.tutor_nome)}</p>
      <p>Telefone: ${escapar(v.telefone)}</p>
      <p>Endereço: ${escapar(v.endereco)}</p>
      <p>Data: ${escapar(v.data_visita)}</p>
      <p>Entrada: ${escapar(v.hora_entrada)}</p>
      <p>Saída: ${escapar(v.hora_saida || "Não informada")}</p>
      <p>Serviços: ${escapar(v.servicos)}</p>
      <p>Observações: ${escapar(v.observacoes)}</p>
      <p>Valor: R$ ${Number(v.valor).toFixed(2)}</p>

      <span class="status">${escapar(v.payment)}</span>
    </div>
  `).join("") || "<p>Nenhuma visita cadastrada.</p>";
}


/* ======================================
   PAINEL PRINCIPAL
====================================== */

async function atualizarPainel() {
  const data = hoje();

  const [
    petsResult,
    crecheResult,
    staysResult,
    pendentesResult,
    avaliacoesResult,
    visitasResult
  ] = await Promise.all([

    db.from("pets")
      .select("id", { count: "exact", head: true }),

    db.from("daycare")
      .select("id", { count: "exact", head: true })
      .eq("date", data)
      .is("exit_time", null),

    db.from("stays")
      .select("id", { count: "exact", head: true })
      .eq("status", "Hospedado"),

    db.from("stays")
      .select("id", { count: "exact", head: true })
      .neq("payment", "Pago")
      .eq("status", "Hospedado"),

    db.from("avaliacoes")
      .select("id", { count: "exact", head: true }),

    db.from("visitas")
      .select("id", { count: "exact", head: true })

  ]);

  $("totalPets").textContent = petsResult.error
    ? "-" : (petsResult.count ?? 0);

  $("totalCreche").textContent = crecheResult.error
    ? "-" : (crecheResult.count ?? 0);

  $("totalHospedados").textContent = staysResult.error
    ? "-" : (staysResult.count ?? 0);

  $("totalPendentes").textContent = pendentesResult.error
    ? "-" : (pendentesResult.count ?? 0);

  $("totalAvaliacoes").textContent = avaliacoesResult.error
    ? "-" : (avaliacoesResult.count ?? 0);

  $("totalVisitas").textContent = visitasResult.error
    ? "-" : (visitasResult.count ?? 0);

  const erros = [
    petsResult.error,
    crecheResult.error,
    staysResult.error,
    pendentesResult.error,
    avaliacoesResult.error,
    visitasResult.error
  ].filter(Boolean);

  if (erros.length) {
    console.error("Erros ao atualizar o painel:", erros);
  }
}