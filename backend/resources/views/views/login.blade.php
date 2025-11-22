<div class="p-8 w-96 bg-white rounded-lg shadow-lg">
    <h2 class="mb-6 text-2xl font-bold text-center text-gray-800">Acceso Administrativo</h2>

    @if ($errors->any())
        <div class="py-3 px-4 mb-4 text-red-700 bg-red-100 rounded border border-red-400">
            {{ $errors->first('email') }}
        </div>
    @endif

    <form action="{{ route('login.submit') }}" method="POST">
        @csrf <div class="mb-4">
            <label class="block mb-2 text-sm font-bold text-gray-700">Correo Electrónico</label>
            <input type="email" name="email" required
                class="py-2 px-3 w-full rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="admin@asislegal.com">
        </div>

        <div class="mb-6">
            <label class="block mb-2 text-sm font-bold text-gray-700">Contraseña</label>
            <input type="password" name="password" required
                class="py-2 px-3 w-full rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="••••••••">
        </div>

        <button type="submit"
            class="py-2 px-4 w-full font-bold text-white bg-blue-600 rounded transition duration-300 hover:bg-blue-700">
            Ingresar al Dashboard
        </button>
    </form>
</div>
